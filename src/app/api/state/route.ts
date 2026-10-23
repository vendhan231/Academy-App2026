import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { SessionPayload } from '@/lib/session';
import { Coach } from '@/types';
import {
  AcademyStore,
  assignedSportIds,
  getStore,
  persistStore,
  studentForSession,
  visibleStudents,
} from '@/server/store';

const COLLECTIONS = [
  'students',
  'coaches',
  'enrollments',
  'coachAssignments',
  'attendance',
  'announcements',
  'archivedStudents',
  'facilities',
  'bookings',
  'coachAttendance',
  'invoices',
  'payroll',
  'broadcasts',
  'incidents',
  'media',
] as const satisfies readonly (keyof AcademyStore)[];

function visibleState(session: SessionPayload): AcademyStore {
  const store = getStore();
  const studentsWithoutPasswords = (items: AcademyStore['students']) =>
    items.map(({ password: _password, ...student }) => student);
  if (session.role === 'ADMIN') {
    return { ...store, students: studentsWithoutPasswords(store.students) };
  }

  const students = studentsWithoutPasswords(visibleStudents(session));
  const studentIds = new Set(students.map((student) => student.id));
  const sportIds =
    session.role === 'COACH'
      ? new Set(assignedSportIds(store.coaches.find((coach) => coach.userId === session.userId)?.id ?? ''))
      : new Set(store.enrollments.filter((item) => item.studentId === students[0]?.id && item.active).map((item) => item.sportId));
  const ownStudent = session.role === 'STUDENT' ? studentForSession(session) : null;

  return {
    students,
    coaches: session.role === 'COACH'
      ? store.coaches.filter((coach) => coach.userId === session.userId)
      : store.coaches.filter((coach) => store.coachAssignments.some((assignment) => sportIds.has(assignment.sportId) && assignment.coachId === coach.id)),
    enrollments: store.enrollments.filter((item) => studentIds.has(item.studentId)),
    coachAssignments: store.coachAssignments.filter((item) => sportIds.has(item.sportId)),
    attendance: store.attendance.filter((item) => studentIds.has(item.studentId)),
    announcements: session.role === 'COACH'
      ? store.announcements
      : store.announcements.filter((item) => item.audience === 'ALL' || item.audience === session.role),
    archivedStudents: [],
    facilities: store.facilities,
    bookings: store.bookings.filter((item) =>
      item.bookedByUserId === session.userId || (sportIds.has(item.sport) && session.role !== 'STUDENT')
    ),
    coachAttendance: session.role === 'COACH'
      ? store.coachAttendance.filter((item) => item.coachId === store.coaches.find((coach) => coach.userId === session.userId)?.id)
      : [],
    invoices: ownStudent ? store.invoices.filter((item) => item.studentId === ownStudent.id) : [],
    payroll: session.role === 'COACH'
      ? store.payroll.filter((item) => item.coachId === store.coaches.find((coach) => coach.userId === session.userId)?.id)
      : [],
    broadcasts: store.broadcasts.filter((item) =>
      item.targetCriteria.targetType === 'ALL_PARENTS' ||
      (item.targetCriteria.targetType === 'SPORT' && sportIds.has(item.targetCriteria.targetValue as never))
    ),
    incidents: session.role === 'COACH'
      ? store.incidents.filter((item) => sportIds.has(item.sport))
      : [],
    media: session.role === 'COACH' ? store.media : store.media.filter((item) => item.isApproved),
  };
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function rejectChangedReadOnlyCollections(
  incoming: Record<string, unknown>,
  expected: AcademyStore,
  writable: readonly (keyof AcademyStore)[]
) {
  for (const key of COLLECTIONS) {
    if (!writable.includes(key) && !sameValue(incoming[key], expected[key])) {
      throw new ApiError(403, `You cannot modify ${key}.`);
    }
  }
}

function mergeCoachState(incoming: Record<string, unknown>, expected: AcademyStore, session: SessionPayload) {
  const store = getStore();
  const coach = store.coaches.find((item) => item.userId === session.userId);
  if (!coach) throw new ApiError(403, 'No coach profile is linked to this account.');
  rejectChangedReadOnlyCollections(incoming, expected, [
    'coaches', 'students', 'coachAttendance', 'incidents', 'bookings',
  ]);

  const incomingCoaches = incoming.coaches as Coach[];
  if (incomingCoaches.length !== expected.coaches.length || incomingCoaches.some((item) => item.id !== coach.id)) {
    throw new ApiError(400, 'Coach profile changes are invalid.');
  }
  const nextCoach = incomingCoaches[0];
  const allowedCoach = {
    ...coach,
    bio: nextCoach.bio,
    phone: nextCoach.phone,
    certification: nextCoach.certification,
    isCheckedInToday: nextCoach.isCheckedInToday,
    lastCheckInTime: nextCoach.lastCheckInTime,
  };
  if (!sameValue(nextCoach, allowedCoach)) {
    throw new ApiError(403, 'Only coach profile details and check-in status can be changed from the coach portal.');
  }
  Object.assign(coach, {
    bio: nextCoach.bio,
    phone: nextCoach.phone,
    certification: nextCoach.certification,
    isCheckedInToday: nextCoach.isCheckedInToday,
    lastCheckInTime: nextCoach.lastCheckInTime,
  });

  const sportIds = new Set(assignedSportIds(coach.id));
  const currentStudents = new Map(expected.students.map((item) => [item.id, item]));
  const nextStudents = incoming.students as AcademyStore['students'];
  if (nextStudents.length !== currentStudents.size) throw new ApiError(400, 'Student updates are invalid.');
  for (const next of nextStudents) {
    const previous = currentStudents.get(next.id);
    if (!previous) throw new ApiError(403, 'You cannot modify a student outside your assigned sports.');
    const enrolled = store.enrollments.some((item) => item.studentId === next.id && item.active && sportIds.has(item.sportId));
    if (!enrolled) throw new ApiError(403, 'You cannot modify a student outside your assigned sports.');
    if (!sameValue(next.achievements, previous.achievements)) {
      throw new ApiError(403, 'Manage achievements through the achievements API.');
    }
    const normalizedNext = { ...next, skillRatings: previous.skillRatings, achievements: previous.achievements };
    if (!sameValue(normalizedNext, previous)) throw new ApiError(403, 'Only skill ratings can be updated through shared state. Use the achievement API for achievement changes.');
    const stored = store.students.find((item) => item.id === next.id)!;
    stored.skillRatings = next.skillRatings;
  }

  const existingCoachAttendance = expected.coachAttendance;
  const nextCoachAttendance = incoming.coachAttendance as AcademyStore['coachAttendance'];
  if (nextCoachAttendance.length < existingCoachAttendance.length) {
    throw new ApiError(403, 'Coach attendance history cannot be deleted.');
  }
  for (let index = 0; index < existingCoachAttendance.length; index += 1) {
    const previous = existingCoachAttendance[index];
    const next = nextCoachAttendance.find((item) => item.id === previous.id);
    if (!next) throw new ApiError(403, 'Existing coach attendance records cannot be deleted.');
    if (!sameValue(previous, next)) {
      if (
        previous.coachId !== coach.id ||
        previous.checkOutTime ||
        !next.checkOutTime ||
        !sameValue({ ...previous, checkOutTime: next.checkOutTime }, next)
      ) {
        throw new ApiError(403, 'Only an open shift can be checked out.');
      }
      const stored = store.coachAttendance.find((item) => item.id === previous.id);
      if (stored) stored.checkOutTime = next.checkOutTime;
    }
  }
  const existingAttendanceIds = new Set(existingCoachAttendance.map((item) => item.id));
  for (const record of nextCoachAttendance.filter((item) => !existingAttendanceIds.has(item.id))) {
    if (
      record.coachId !== coach.id ||
      record.geofenceVerified ||
      record.isVerifiedForPayroll ||
      record.distanceFromAcademyMeters !== 0
    ) {
      throw new ApiError(400, 'Check-in records must be unverified until location validation is configured.');
    }
  }
  store.coachAttendance.push(...nextCoachAttendance.filter((item) => !existingAttendanceIds.has(item.id)));

  const existingIncidents = expected.incidents;
  const nextIncidents = incoming.incidents as AcademyStore['incidents'];
  const nextIncidentById = new Map(nextIncidents.map((item) => [item.id, item]));
  for (const previous of existingIncidents) {
    if (!sameValue(previous, nextIncidentById.get(previous.id))) {
      throw new ApiError(403, 'Existing incident reports cannot be changed.');
    }
  }
  const existingIncidentIds = new Set(existingIncidents.map((item) => item.id));
  for (const incident of nextIncidents.filter((item) => !existingIncidentIds.has(item.id))) {
    if (
      incident.reportedByCoachName !== session.name ||
      !sportIds.has(incident.sport) ||
      !currentStudents.has(incident.studentId)
    ) {
      throw new ApiError(403, 'Incident report is outside your assigned students or sports.');
    }
    store.incidents.unshift(incident);
  }

  mergeOwnBookings(incoming.bookings as AcademyStore['bookings'], expected.bookings, session);
}

function mergeOwnBookings(
  incoming: AcademyStore['bookings'],
  expected: AcademyStore['bookings'],
  session: SessionPayload
) {
  const store = getStore();
  const nextById = new Map(incoming.map((item) => [item.id, item]));
  const expectedById = new Map(expected.map((item) => [item.id, item]));

  for (const [id, previous] of expectedById) {
    const next = nextById.get(id);
    if (!next) throw new ApiError(403, 'Existing bookings cannot be deleted.');
    if (!sameValue(previous, next)) {
      if (previous.bookedByUserId !== session.userId || next.status !== 'CANCELLED' || !sameValue({ ...previous, status: 'CANCELLED' }, next)) {
        throw new ApiError(403, 'You can only cancel your own bookings.');
      }
      const stored = store.bookings.find((item) => item.id === id);
      if (stored) stored.status = 'CANCELLED';
    }
  }

  for (const booking of incoming) {
    if (expectedById.has(booking.id)) continue;
    if (booking.bookedByUserId !== session.userId || booking.bookedByRole !== session.role) {
      throw new ApiError(403, 'New bookings must belong to the signed-in account.');
    }
    const facility = store.facilities.find((item) => item.id === booking.facilityId && item.sport === booking.sport);
    if (
      !facility ||
      !/^\d{4}-\d{2}-\d{2}$/.test(booking.date) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(booking.startTime) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(booking.endTime) ||
      booking.date < new Date().toISOString().slice(0, 10) ||
      booking.startTime >= booking.endTime ||
      Number(booking.startTime.slice(0, 2)) * 60 + Number(booking.startTime.slice(3)) < facility.openingHour * 60 ||
      Number(booking.endTime.slice(0, 2)) * 60 + Number(booking.endTime.slice(3)) > facility.closingHour * 60
    ) {
      throw new ApiError(400, 'Booking facility or date is invalid.');
    }
    const overlaps = store.bookings.some((item) =>
      item.facilityId === booking.facilityId &&
      item.date === booking.date &&
      item.status !== 'CANCELLED' &&
      booking.startTime < item.endTime &&
      booking.endTime > item.startTime
    );
    if (overlaps) throw new ApiError(409, 'That facility is already booked for the selected time.');
    store.bookings.push(booking);
  }
}

function validateAdminBookings(bookings: AcademyStore['bookings']) {
  const store = getStore();
  const seenIds = new Set<string>();
  const active = bookings.filter((item) => item.status !== 'CANCELLED');
  for (const booking of bookings) {
    if (seenIds.has(booking.id)) throw new ApiError(400, 'Booking IDs must be unique.');
    seenIds.add(booking.id);
    const facility = store.facilities.find((item) => item.id === booking.facilityId && item.sport === booking.sport);
    if (
      !facility ||
      !/^\d{4}-\d{2}-\d{2}$/.test(booking.date) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(booking.startTime) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(booking.endTime) ||
      booking.startTime >= booking.endTime ||
      Number(booking.startTime.slice(0, 2)) * 60 + Number(booking.startTime.slice(3)) < facility.openingHour * 60 ||
      Number(booking.endTime.slice(0, 2)) * 60 + Number(booking.endTime.slice(3)) > facility.closingHour * 60
    ) {
      throw new ApiError(400, 'One or more booking records are invalid.');
    }
  }
  for (let index = 0; index < active.length; index += 1) {
    for (let other = index + 1; other < active.length; other += 1) {
      const left = active[index];
      const right = active[other];
      if (
        left.facilityId === right.facilityId &&
        left.date === right.date &&
        left.startTime < right.endTime &&
        left.endTime > right.startTime
      ) {
        throw new ApiError(409, 'Facility bookings cannot overlap.');
      }
    }
  }
}

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);
    return NextResponse.json({ success: true, state: visibleState(session) });
  });
}

export async function PUT(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH', 'STUDENT']);

    const body = await req.json().catch(() => null);
    const incoming = body?.state;
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      throw new ApiError(400, 'A valid state object is required.');
    }
    if (COLLECTIONS.some((key) => !Array.isArray(incoming[key]))) {
      throw new ApiError(400, 'Every academy collection must be provided as an array.');
    }

    if (session.role === 'ADMIN') {
      validateAdminBookings(incoming.bookings as AcademyStore['bookings']);
      const store = getStore();
      if (!sameValue(incoming.announcements, store.announcements)) {
        throw new ApiError(403, 'Manage announcements through the announcements API.');
      }
      if (!sameValue(incoming.media, store.media)) {
        throw new ApiError(403, 'Manage media through the secure media API.');
      }
      const currentStudents = new Map(store.students.map((student) => [student.id, student]));
      for (const next of incoming.students as AcademyStore['students']) {
        const existing = currentStudents.get(next.id);
        if (existing && !sameValue(next.achievements, existing.achievements)) {
          throw new ApiError(403, 'Manage achievements through the achievements API.');
        }
      }
      for (const key of COLLECTIONS) {
        if (key === 'announcements' || key === 'media') continue;
        store[key] = incoming[key] as never;
      }
    } else {
      const expected = visibleState(session);
      const backup = structuredClone(getStore());
      try {
        if (session.role === 'COACH') {
          mergeCoachState(incoming, expected, session);
        } else {
          rejectChangedReadOnlyCollections(incoming, expected, ['bookings']);
          mergeOwnBookings(incoming.bookings as AcademyStore['bookings'], expected.bookings, session);
        }
      } catch (error) {
        Object.assign(getStore(), backup);
        throw error;
      }
    }
    await persistStore();
    return NextResponse.json({ success: true, updatedAt: new Date().toISOString() });
  });
}
