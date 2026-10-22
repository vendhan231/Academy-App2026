import {
  ActiveStudent,
  Announcement,
  AttendanceRecord,
  AttendanceStatus,
  Coach,
  CoachAssignment,
  Enrollment,
  ArchivedStudent,
  CoachAttendanceRecord,
  CoachPayrollRecord,
  EmergencyBroadcast,
  Facility,
  FacilityBooking,
  IncidentReport,
  MediaItem,
  StudentInvoice,
  User,
} from '@/types';
import { SportId, SPORTS } from '@/lib/sports';
import { SessionPayload } from '@/lib/session';
import {
  INITIAL_ACTIVE_STUDENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ARCHIVED_STUDENTS,
  INITIAL_BOOKINGS,
  INITIAL_COACH_ASSIGNMENTS,
  INITIAL_COACH_ATTENDANCE,
  INITIAL_COACHES,
  INITIAL_ENROLLMENTS,
  INITIAL_FACILITIES,
  INITIAL_INVOICES,
  INITIAL_PAYROLL,
  INITIAL_BROADCASTS,
  INITIAL_INCIDENTS,
  INITIAL_MEDIA,
  INITIAL_USERS,
} from '@/data/initialData';
import { buildInitialAttendance } from '@/data/attendanceSeed';
import { connectToMongo, getDb, mongoState } from '@/lib/mongo';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { randomUUID } from 'node:crypto';

/**
 * Server side academy store.
 *
 * The API layer never trusts the client: every read is filtered by the role
 * carried in the signed session, and every write is validated against the
 * coach assignments before it is applied. The store lives on `globalThis` so
 * the data survives hot reloading in development.
 */

export interface AcademyStore {
  students: ActiveStudent[];
  coaches: Coach[];
  enrollments: Enrollment[];
  coachAssignments: CoachAssignment[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  archivedStudents: ArchivedStudent[];
  facilities: Facility[];
  bookings: FacilityBooking[];
  coachAttendance: CoachAttendanceRecord[];
  invoices: StudentInvoice[];
  payroll: CoachPayrollRecord[];
  broadcasts: EmergencyBroadcast[];
  incidents: IncidentReport[];
  media: MediaItem[];
}

const STORE_KEYS: Array<keyof AcademyStore> = [
  'students', 'coaches', 'enrollments', 'coachAssignments', 'attendance',
  'announcements', 'archivedStudents', 'facilities', 'bookings', 'coachAttendance',
  'invoices', 'payroll', 'broadcasts', 'incidents', 'media',
];

const globalForStore = globalThis as unknown as { __vendhanStore?: AcademyStore };
const globalForUsers = globalThis as unknown as { __vendhanUsers?: User[] };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  if (!stored.startsWith('scrypt$')) return stored === password;
  const [, salt, expectedHex] = stored.split('$');
  if (!salt || !/^[a-f0-9]{64}$/i.test(expectedHex ?? '')) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createBootstrapAdmin(): User {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME?.trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!username || !password || password.length < 16) {
    throw new Error('Set BOOTSTRAP_ADMIN_USERNAME and a BOOTSTRAP_ADMIN_PASSWORD of at least 16 characters.');
  }
  return {
    id: 'user-admin-bootstrap',
    role: 'ADMIN',
    username,
    password: hashPassword(password),
    name: process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'Academy Administrator',
    email: '',
    phoneNumber: '',
    avatar: '',
  };
}

function getUsers(): User[] {
  if (!globalForUsers.__vendhanUsers) {
    if (process.env.NODE_ENV === 'production') {
      globalForUsers.__vendhanUsers = [createBootstrapAdmin()];
      return globalForUsers.__vendhanUsers;
    }
    globalForUsers.__vendhanUsers = INITIAL_USERS.map((user) => ({
      ...user,
      password: user.password ? hashPassword(user.password) : undefined,
    }));
  }
  return globalForUsers.__vendhanUsers;
}

export { getUsers };

export function resetUsers(): void {
  globalForUsers.__vendhanUsers = undefined;
  getUsers();
}

function createStore(): AcademyStore {
  return {
    students: INITIAL_ACTIVE_STUDENTS.map((student) => ({ ...student })),
    coaches: INITIAL_COACHES.map((coach) => ({ ...coach })),
    enrollments: INITIAL_ENROLLMENTS.map((enrollment) => ({ ...enrollment })),
    coachAssignments: INITIAL_COACH_ASSIGNMENTS.map((assignment) => ({ ...assignment })),
    attendance: buildInitialAttendance(),
    announcements: INITIAL_ANNOUNCEMENTS.map((announcement) => ({ ...announcement })),
    archivedStudents: INITIAL_ARCHIVED_STUDENTS.map((item) => ({ ...item })),
    facilities: INITIAL_FACILITIES.map((item) => ({ ...item })),
    bookings: INITIAL_BOOKINGS.map((item) => ({ ...item })),
    coachAttendance: INITIAL_COACH_ATTENDANCE.map((item) => ({ ...item })),
    invoices: INITIAL_INVOICES.map((item) => ({ ...item })),
    payroll: INITIAL_PAYROLL.map((item) => ({ ...item })),
    broadcasts: INITIAL_BROADCASTS.map((item) => ({ ...item })),
    incidents: INITIAL_INCIDENTS.map((item) => ({ ...item })),
    media: INITIAL_MEDIA.map((item) => ({ ...item })),
  };
}

export function getStore(): AcademyStore {
  if (!globalForStore.__vendhanStore) {
    globalForStore.__vendhanStore = createStore();
  }
  const store = globalForStore.__vendhanStore;
  if (STORE_KEYS.some((key) => !Array.isArray(store[key]))) {
    const defaults = createStore();
    for (const key of STORE_KEYS) {
      if (!Array.isArray(store[key])) store[key] = defaults[key] as never;
    }
  }
  return store;
}

/**
 * Loads the latest shared store before a protected API operation. With no
 * MongoDB URL configured, the app intentionally uses the seeded demo store.
 */
export async function ensureStoreReady(): Promise<void> {
  await connectToMongo();

  if (!mongoState.configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI must be configured in production; in-memory demo data is development-only.');
    }
    return;
  }
  if (!mongoState.connected) {
    throw new Error(`MongoDB is configured but unavailable: ${mongoState.error ?? 'connection failed'}`);
  }

  const db = getDb();
  if (!db) throw new Error('MongoDB connected without an available database handle.');

  const store = getStore();
  const collection = db.collection<{ key: string; data: AcademyStore; updatedAt: Date }>(
    'academy_state'
  );
  await collection.createIndex({ key: 1 }, { unique: true });
  await collection.updateOne(
    { key: 'primary' },
    { $setOnInsert: { key: 'primary', data: store, updatedAt: new Date() } },
    { upsert: true }
  );

  const snapshot = await collection.findOne({ key: 'primary' });
  if (!snapshot) throw new Error('MongoDB academy data could not be initialized.');
  const previousKeys = Object.keys(snapshot.data);
  const migrated = STORE_KEYS.some((key) => !previousKeys.includes(key));
  if (migrated) Object.assign(store, createStore(), snapshot.data);
  else Object.assign(store, snapshot.data);
  if (migrated) {
    await collection.replaceOne(
      { key: 'primary' },
      { key: 'primary', data: store, updatedAt: new Date() },
      { upsert: true }
    );
  }

  const usersCollection = db.collection<{ key: string; data: User[]; updatedAt: Date }>('academy_users');
  await usersCollection.createIndex({ key: 1 }, { unique: true });
  await usersCollection.updateOne(
    { key: 'primary' },
    { $setOnInsert: { key: 'primary', data: getUsers(), updatedAt: new Date() } },
    { upsert: true }
  );
  const usersSnapshot = await usersCollection.findOne({ key: 'primary' });
  if (!usersSnapshot) throw new Error('MongoDB academy accounts could not be initialized.');
  const loadedUsers = usersSnapshot.data;
  if (process.env.NODE_ENV === 'production') {
    const demoIds = new Set(INITIAL_USERS.map((user) => user.id));
    const safeUsers = loadedUsers.filter((user) => !demoIds.has(user.id));
    let changed = safeUsers.length !== loadedUsers.length;
    globalForUsers.__vendhanUsers = safeUsers;
    if (!safeUsers.some((user) => user.role === 'ADMIN')) {
      safeUsers.push(createBootstrapAdmin());
      changed = true;
    }
    if (changed) await persistUsers();
  } else {
    globalForUsers.__vendhanUsers = loadedUsers;
  }
}

/** Persists the current shared store after a successful API mutation. */
export async function persistStore(): Promise<void> {
  const db = getDb();
  if (!db) return;

  await db.collection<{ key: string; data: AcademyStore; updatedAt: Date }>('academy_state').replaceOne(
    { key: 'primary' },
    { key: 'primary', data: getStore(), updatedAt: new Date() },
    { upsert: true }
  );
}

export async function persistUsers(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.collection<{ key: string; data: User[]; updatedAt: Date }>('academy_users').replaceOne(
    { key: 'primary' },
    { key: 'primary', data: getUsers(), updatedAt: new Date() },
    { upsert: true }
  );
}

/** Puts the academy back to its seeded state. */
export function resetStore(): AcademyStore {
  globalForStore.__vendhanStore = createStore();
  return globalForStore.__vendhanStore;
}

/* ------------------------------------------------------------------ */
/* Identity resolution                                                 */
/* ------------------------------------------------------------------ */

/** The coach record behind a coach session, if any. */
export function coachForSession(session: SessionPayload): Coach | null {
  const store = getStore();
  return (
    store.coaches.find((coach) => coach.userId === session.userId) ??
    store.coaches.find((coach) => coach.id === session.userId) ??
    null
  );
}

/** The student record behind a student session, if any. */
export function studentForSession(session: SessionPayload): ActiveStudent | null {
  const store = getStore();
  const user = getUsers().find((candidate) => candidate.id === session.userId);
  const studentId = user?.studentId ?? session.userId;
  return store.students.find((student) => student.id === studentId) ?? null;
}

/** The sports a coach is allowed to see and mark attendance for. */
export function assignedSportIds(coachId: string): SportId[] {
  const store = getStore();
  return store.coachAssignments
    .filter((assignment) => assignment.coachId === coachId)
    .map((assignment) => assignment.sportId)
    .filter((id, index, list) => list.indexOf(id) === index);
}

/** The sports a student is enrolled in. */
export function enrolledSportIds(studentId: string): SportId[] {
  const store = getStore();
  return store.enrollments
    .filter((enrollment) => enrollment.studentId === studentId && enrollment.active)
    .map((enrollment) => enrollment.sportId)
    .filter((id, index, list) => list.indexOf(id) === index);
}

/* ------------------------------------------------------------------ */
/* Role scoped reads                                                   */
/* ------------------------------------------------------------------ */

/** Students the signed in role is allowed to see. */
export function visibleStudents(session: SessionPayload): ActiveStudent[] {
  const store = getStore();

  if (session.role === 'ADMIN') return store.students;

  if (session.role === 'COACH') {
    const coach = coachForSession(session);
    if (!coach) return [];
    const sportIds = new Set(assignedSportIds(coach.id));
    const allowed = new Set(
      store.enrollments
        .filter((enrollment) => sportIds.has(enrollment.sportId))
        .map((enrollment) => enrollment.studentId)
    );
    return store.students.filter((student) => allowed.has(student.id));
  }

  if (session.role === 'STUDENT') {
    const student = studentForSession(session);
    return student ? [student] : [];
  }

  return [];
}

/** Attendance rows the signed in role is allowed to see. */
export function visibleAttendance(session: SessionPayload): AttendanceRecord[] {
  const store = getStore();

  if (session.role === 'ADMIN') return store.attendance;

  if (session.role === 'COACH') {
    const coach = coachForSession(session);
    if (!coach) return [];
    const sportIds = new Set(assignedSportIds(coach.id));
    return store.attendance.filter((record) => sportIds.has(record.sportId));
  }

  if (session.role === 'STUDENT') {
    const student = studentForSession(session);
    if (!student) return [];
    return store.attendance.filter((record) => record.studentId === student.id);
  }

  return [];
}

/** Announcements targeted at the signed in role. */
export function visibleAnnouncements(session: SessionPayload): Announcement[] {
  const store = getStore();
  return store.announcements.filter(
    (announcement) => announcement.audience === 'ALL' || announcement.audience === session.role
  );
}

/** True when the coach owns the given sport. */
export function coachOwnsSport(session: SessionPayload, sportId: SportId): boolean {
  if (session.role === 'ADMIN') return true;
  if (session.role !== 'COACH') return false;
  const coach = coachForSession(session);
  if (!coach) return false;
  return assignedSportIds(coach.id).includes(sportId);
}

/** True when the signed in role may see the given student's attendance. */
export function canViewStudent(session: SessionPayload, studentId: string): boolean {
  if (session.role === 'ADMIN') return true;
  if (session.role === 'STUDENT') {
    const student = studentForSession(session);
    return student?.id === studentId;
  }
  if (session.role === 'COACH') {
    return visibleStudents(session).some((student) => student.id === studentId);
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

/**
 * Upserts attendance for one date/sport. Existing rows for the same
 * date, sport and student are updated in place so that re-marking a sheet
 * never creates duplicates.
 */
export function upsertAttendance(
  date: string,
  sportId: SportId,
  entries: Array<{ studentId: string; status: AttendanceStatus }>,
  markedBy: string
): AttendanceRecord[] {
  const store = getStore();
  const markedAt = new Date().toISOString();

  for (const entry of entries) {
    const index = store.attendance.findIndex(
      (record) =>
        record.date === date && record.sportId === sportId && record.studentId === entry.studentId
    );

    if (index >= 0) {
      store.attendance[index] = {
        ...store.attendance[index],
        status: entry.status,
        markedBy,
        markedAt,
      };
    } else {
      store.attendance.push({
        id: `att-${date}-${entry.studentId}-${sportId}`,
        date,
        sportId,
        studentId: entry.studentId,
        status: entry.status,
        markedBy,
        markedAt,
      });
    }
  }

  return store.attendance.filter((record) => record.date === date && record.sportId === sportId);
}

/** Creates a student record together with its enrolments. */
export function createStudent(
  input: Partial<ActiveStudent> & { firstName: string; lastName: string },
  sportIds: SportId[]
): { student: ActiveStudent; credentials: { username: string; password: string } } {
  const store = getStore();
  const largestNumber = [...store.students, ...store.archivedStudents]
    .map((item) => Number(item.studentCode.match(/(\d+)$/)?.[1] ?? 0))
    .reduce((largest, value) => Math.max(largest, value), 0);
  const nextNumber = String(largestNumber + 1).padStart(3, '0');
  const id = `stu-active-${nextNumber}`;

  const student: ActiveStudent = {
    id,
    studentCode: `VEN-${nextNumber}`,
    loginId: nextNumber,
    parentUserId: input.parentUserId ?? 'user-parent-1',
    parentName: input.parentName ?? 'Parent Guardian',
    parentPhone: input.parentPhone ?? '+19876543210',
    parentEmail: input.parentEmail ?? 'parent@example.com',
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob ?? '2014-01-01',
    gender: input.gender ?? 'Male',
    residentialAddress: input.residentialAddress ?? '742 Academy Drive',
    photoUrl:
      input.photoUrl ??
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bloodGroup: input.bloodGroup ?? 'O+',
    medicalNotes: input.medicalNotes ?? 'No chronic restrictions.',
    chronicAilments: input.chronicAilments ?? [],
    allergies: input.allergies ?? [],
    emergencyDoctorContact: input.emergencyDoctorContact ?? {
      name: 'Academy Medical Desk',
      phone: '+15559870000',
      clinic: 'West Hills Sports Medicine',
    },
    digitalLiabilityWaiverSigned: input.digitalLiabilityWaiverSigned ?? true,
    waiverSignedDate: new Date().toISOString().split('T')[0],
    batchShift: input.batchShift ?? 'Morning 06:00 - 08:00 Squad',
    primaryAssignedCoachId: input.primaryAssignedCoachId ?? 'coach-1',
    primaryAssignedCoachName: input.primaryAssignedCoachName ?? 'Elena Rostova',
    dateOfJoining: input.dateOfJoining ?? new Date().toISOString().split('T')[0],
    isActive: true,
    achievements: input.achievements ?? [],
    skillRatings: input.skillRatings ?? {
      stamina: 3,
      agility: 3,
      technique: 3,
      discipline: 3,
      lastUpdated: new Date().toISOString().split('T')[0],
      updatedByCoachName: 'Academy Staff',
      badges: ['Newly enrolled'],
      coachFeedbackNotes: 'Baseline assessment pending.',
    },
  };

  store.students.unshift(student);
  const password = randomBytes(12).toString('base64url');
  getUsers().push({
    id: `user-${id}`,
    role: 'STUDENT',
    username: nextNumber,
    password: hashPassword(password),
    name: `${student.firstName} ${student.lastName}`,
    email: student.parentEmail,
    phoneNumber: student.parentPhone,
    avatar: student.photoUrl,
    studentId: student.id,
  });

  sportIds.forEach((sportId, index) => {
    store.enrollments.push({
      id: `en-${id}-${sportId}-${index}`,
      studentId: id,
      sportId,
      joinedAt: student.dateOfJoining,
      active: true,
    });
  });

  return { student, credentials: { username: nextNumber, password } };
}

export function createCoach(input: {
  name: string;
  email: string;
  phone: string;
  certification: string;
  sportIds: SportId[];
}): { coach: Coach; credentials: { username: string; password: string } } {
  const store = getStore();
  const id = `coach-${randomUUID()}`;
  const userId = `user-${id}`;
  const username = input.email.split('@')[0].toLowerCase();
  let availableUsername = username;
  let suffix = 1;
  while (getUsers().some((user) => user.username?.toLowerCase() === availableUsername)) {
    availableUsername = `${username}${suffix}`;
    suffix += 1;
  }
  const password = randomBytes(12).toString('base64url');
  const coach: Coach = {
    id,
    userId,
    name: input.name,
    email: input.email,
    phone: input.phone,
    certification: input.certification,
    avatar: '',
    baseSalary: 0,
    perSessionRate: 0,
    verifiedSessionsThisMonth: 0,
    bio: '',
    isCheckedInToday: false,
  };
  store.coaches.push(coach);
  input.sportIds.forEach((sportId) => store.coachAssignments.push({
    id: `assignment-${randomUUID()}`,
    coachId: id,
    sportId,
  }));
  getUsers().push({
    id: userId,
    role: 'COACH',
    username: availableUsername,
    password: hashPassword(password),
    name: input.name,
    email: input.email,
    phoneNumber: input.phone,
    avatar: '',
    coachId: id,
  });
  return { coach, credentials: { username: availableUsername, password } };
}

/** Every sport the academy offers. */
export const ALL_SPORTS = SPORTS;
