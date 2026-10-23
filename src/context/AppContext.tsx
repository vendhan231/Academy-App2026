'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActiveStudent,
  Announcement,
  ArchivedStudent,
  AttendanceRecord,
  AttendanceStatus,
  BloodGroup,
  Coach,
  CoachAssignment,
  CoachAttendanceRecord,
  CoachPayrollRecord,
  EmergencyBroadcast,
  Enrollment,
  Facility,
  FacilityBooking,
  IncidentReport,
  IngestValidationIssue,
  MediaItem,
  StudentAttendanceSummary,
  StudentInvoice,
  User,
  UserRole,
  BulkIngestRow,
} from '../types';
import { SportId, SPORTS, isSportId } from '../lib/sports';
import { SessionPayload, SESSION_TOKEN_KEY, roleHome } from '../lib/session';
import { apiGet, apiPost, apiPut } from '../lib/apiClient';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ARCHIVED_STUDENTS,
  INITIAL_ACTIVE_STUDENTS,
  INITIAL_BOOKINGS,
  INITIAL_BROADCASTS,
  INITIAL_COACH_ASSIGNMENTS,
  INITIAL_COACH_ATTENDANCE,
  INITIAL_COACHES,
  INITIAL_ENROLLMENTS,
  INITIAL_FACILITIES,
  INITIAL_INCIDENTS,
  INITIAL_INVOICES,
  INITIAL_MEDIA,
  INITIAL_PAYROLL,
} from '../data/initialData';
import { IMPORTED_ACTIVE_STUDENTS } from '../data/importedStudentSeed';
import { buildSeedAttendance, toISODate } from '../data/attendanceSeed';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  timestamp: string;
}

interface AppContextType {
  /* ---------------- session ---------------- */
  session: SessionPayload | null;
  currentUser: User | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  /** True once the client has resolved the session (avoids SSR mismatch). */
  isReady: boolean;
  signIn: (payload: { user: User; token: string; expiresAt: number }) => void;
  signOut: () => void;

  /* ---------------- catalogue & directory ---------------- */
  students: ActiveStudent[]; // role scoped
  coaches: Coach[];
  enrollments: Enrollment[];
  coachAssignments: CoachAssignment[];
  announcements: Announcement[];
  facilities: Facility[];
  bookings: FacilityBooking[];
  coachAttendance: CoachAttendanceRecord[];
  invoices: StudentInvoice[];
  payroll: CoachPayrollRecord[];
  broadcasts: EmergencyBroadcast[];
  incidents: IncidentReport[];
  media: MediaItem[];
  archivedStudents: ArchivedStudent[]; // admin only

  /* ---------------- role scoped helpers ---------------- */
  myStudent: ActiveStudent | null;
  myCoach: Coach | null;
  mySports: SportId[];
  studentsForSport: (sportId: SportId) => ActiveStudent[];
  sportNamesForStudent: (studentId: string) => string[];

  /* ---------------- attendance ---------------- */
  attendance: AttendanceRecord[];
  attendanceForDate: (date: string, sportId?: SportId) => AttendanceRecord[];
  markAttendance: (
    date: string,
    sportId: SportId,
    entries: Array<{ studentId: string; status: AttendanceStatus }>
  ) => Promise<{ success: boolean; message: string }>;
  markAllPresent: (date: string, sportId: SportId) => Promise<{ success: boolean; message: string }>;
  studentAttendanceSummary: (studentId: string, month?: string) => StudentAttendanceSummary;
  /** True while the client is pulling the latest state from the API. */
  isSyncing: boolean;
  refreshFromServer: () => Promise<void>;

  /* ---------------- directory mutations ---------------- */
  addActiveStudent: (studentData: Partial<ActiveStudent>) => ActiveStudent;
  updateActiveStudent: (id: string, updates: Partial<ActiveStudent>) => void;
  updateCoachProfile: (id: string, updates: Pick<Coach, 'bio' | 'phone' | 'certification'>) => void;
  archiveStudent: (studentId: string, reason: ArchivedStudent['archivalReason'], exitNotes?: string) => void;
  restoreArchivedStudent: (archivedId: string) => void;
  setEnrollments: (studentId: string, sportIds: SportId[]) => void;
  validateBulkIngestionData: (rows: BulkIngestRow[]) => {
    validCount: number;
    errorCount: number;
    issues: IngestValidationIssue[];
    validRows: BulkIngestRow[];
  };
  executeBulkIngest: (validRows: BulkIngestRow[]) => Promise<{
    inserted: number;
    errors: number;
    credentials: Array<{ studentCode: string; username: string; password: string }>;
  }>;

  /* ---------------- coach actions ---------------- */
  markBatchStudentAttendance: (
    records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
    batchName: string,
    sportId: SportId
  ) => Promise<{ success: boolean; message: string }>;
  recordCoachCheckIn: (coachId: string, sessionType: 'Batch Training' | 'Private Coaching' | 'Clinic') => void;
  recordCoachCheckOut: (coachId: string) => void;
  updateStudentSkills: (studentId: string, skills: Partial<ActiveStudent['skillRatings']>) => void;
  awardStudentAchievement: (
    studentId: string,
    achievement: Omit<ActiveStudent['achievements'][number], 'id' | 'studentId'>
  ) => void;
  createIncidentReport: (
    incident: Omit<IncidentReport, 'id' | 'timestamp' | 'parentNotified' | 'parentNotificationSentAt'>
  ) => void;

  /* ---------------- facilities, finance, broadcast, media ---------------- */
  createBooking: (booking: Omit<FacilityBooking, 'id' | 'createdAt' | 'status'>) => {
    success: boolean;
    message: string;
  };
  cancelBooking: (bookingId: string) => void;
  payInvoice: (invoiceId: string) => Promise<void>;
  sendWhatsAppPaymentReminder: (invoiceId: string) => Promise<void>;
  generateNewInvoice: (invoice: Omit<StudentInvoice, 'id' | 'invoiceNumber'>) => void;
  markPayrollDisbursed: (payrollId: string) => void;
  sendEmergencyBroadcast: (broadcast: {
    targetType: 'ALL_PARENTS' | 'SPORT' | 'BATCH';
    targetValue?: string;
    templateKey: EmergencyBroadcast['templateKey'];
    templateTitle: string;
    messageContent: string;
    channel: 'WHATSAPP' | 'SMS_FALLBACK';
  }) => Promise<boolean>;
  uploadMediaItem: (item: Omit<MediaItem, 'id' | 'uploadedAt' | 'isApproved'>) => void;
  toggleApproveMedia: (mediaId: string) => void;

  /* ---------------- notifications & tooling ---------------- */
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/* Storage helpers (SSR safe)                                          */
/* ------------------------------------------------------------------ */

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the in-memory state still works.
  }
}

function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const KEYS = {
  students: 'vsa_students',
  coaches: 'vsa_coaches',
  enrollments: 'vsa_enrollments',
  coachAssignments: 'vsa_coach_assignments',
  attendance: 'vsa_attendance',
  announcements: 'vsa_announcements',
  bookings: 'vsa_bookings',
  coachAttendance: 'vsa_coach_attendance',
  invoices: 'vsa_invoices',
  payroll: 'vsa_payroll',
  broadcasts: 'vsa_broadcasts',
  incidents: 'vsa_incidents',
  media: 'vsa_media',
  archivedStudents: 'vsa_archived_students',
  session: 'vsa_session',
  token: SESSION_TOKEN_KEY,
};

/* ------------------------------------------------------------------ */
/* Seed attendance                                                      */
/* ------------------------------------------------------------------ */

function buildInitialAttendance(): AttendanceRecord[] {
  const enrollments: Record<string, SportId[]> = {};
  for (const enrollment of INITIAL_ENROLLMENTS) {
    enrollments[enrollment.studentId] = enrollments[enrollment.studentId] ?? [];
    enrollments[enrollment.studentId].push(enrollment.sportId);
  }

  const coachBySport: Partial<Record<SportId, string>> = {};
  for (const assignment of INITIAL_COACH_ASSIGNMENTS) {
    const coach = INITIAL_COACHES.find((c) => c.id === assignment.coachId);
    if (coach) coachBySport[assignment.sportId] = coach.userId;
  }

  const yesterday = toISODate(new Date(Date.now() - 86400000));

  return buildSeedAttendance({
    enrollments,
    coachBySport,
    endDate: yesterday,
    days: 21,
    markerIds: ['seed'],
  });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /* ---------------- session ---------------- */
  const [session, setSession] = useState<SessionPayload | null>(() =>
    parseJSON<SessionPayload>(readStorage(KEYS.session))
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  const currentRole = session?.role ?? null;
  const isAuthenticated = Boolean(session && session.expiresAt > Date.now());

  /* ---------------- collections ---------------- */
  const [students, setStudents] = useState<ActiveStudent[]>(
    () => {
      const saved = parseJSON<ActiveStudent[]>(readStorage(KEYS.students));
      if (saved) return saved;
      return [...INITIAL_ACTIVE_STUDENTS, ...IMPORTED_ACTIVE_STUDENTS.map((student) => ({
        ...student,
        chronicAilments: [...student.chronicAilments],
        allergies: [...student.allergies],
        achievements: [...student.achievements],
        skillRatings: {
          ...student.skillRatings,
          badges: [...student.skillRatings.badges],
        },
        emergencyDoctorContact: {
          ...student.emergencyDoctorContact,
        },
      }))];
    }
  );
  const [coaches, setCoaches] = useState<Coach[]>(
    () => parseJSON<Coach[]>(readStorage(KEYS.coaches)) ?? INITIAL_COACHES
  );
  const [enrollments, setEnrollmentsState] = useState<Enrollment[]>(
    () => parseJSON<Enrollment[]>(readStorage(KEYS.enrollments)) ?? INITIAL_ENROLLMENTS
  );
  const [coachAssignments, setCoachAssignments] = useState<CoachAssignment[]>(
    () => parseJSON<CoachAssignment[]>(readStorage(KEYS.coachAssignments)) ?? INITIAL_COACH_ASSIGNMENTS
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    () => parseJSON<AttendanceRecord[]>(readStorage(KEYS.attendance)) ?? buildInitialAttendance()
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    () => parseJSON<Announcement[]>(readStorage(KEYS.announcements)) ?? INITIAL_ANNOUNCEMENTS
  );
  const [facilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [bookings, setBookings] = useState<FacilityBooking[]>(
    () => parseJSON<FacilityBooking[]>(readStorage(KEYS.bookings)) ?? INITIAL_BOOKINGS
  );
  const [coachAttendance, setCoachAttendance] = useState<CoachAttendanceRecord[]>(
    () => parseJSON<CoachAttendanceRecord[]>(readStorage(KEYS.coachAttendance)) ?? INITIAL_COACH_ATTENDANCE
  );
  const [invoices, setInvoices] = useState<StudentInvoice[]>(
    () => parseJSON<StudentInvoice[]>(readStorage(KEYS.invoices)) ?? INITIAL_INVOICES
  );
  const [payroll, setPayroll] = useState<CoachPayrollRecord[]>(
    () => parseJSON<CoachPayrollRecord[]>(readStorage(KEYS.payroll)) ?? INITIAL_PAYROLL
  );
  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>(
    () => parseJSON<EmergencyBroadcast[]>(readStorage(KEYS.broadcasts)) ?? INITIAL_BROADCASTS
  );
  const [incidents, setIncidents] = useState<IncidentReport[]>(
    () => parseJSON<IncidentReport[]>(readStorage(KEYS.incidents)) ?? INITIAL_INCIDENTS
  );
  const [media, setMedia] = useState<MediaItem[]>(
    () => parseJSON<MediaItem[]>(readStorage(KEYS.media)) ?? INITIAL_MEDIA
  );
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>(
    () => parseJSON<ArchivedStudent[]>(readStorage(KEYS.archivedStudents)) ?? INITIAL_ARCHIVED_STUDENTS
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSharedStateReady = useRef(false);
  const lastSharedState = useRef('');

  /* ---------------- persistence ---------------- */
  useEffect(() => writeStorage(KEYS.students, students), [students]);
  useEffect(() => writeStorage(KEYS.coaches, coaches), [coaches]);
  useEffect(() => writeStorage(KEYS.enrollments, enrollments), [enrollments]);
  useEffect(() => writeStorage(KEYS.coachAssignments, coachAssignments), [coachAssignments]);
  useEffect(() => writeStorage(KEYS.attendance, attendance), [attendance]);
  useEffect(() => writeStorage(KEYS.announcements, announcements), [announcements]);
  useEffect(() => writeStorage(KEYS.bookings, bookings), [bookings]);
  useEffect(() => writeStorage(KEYS.coachAttendance, coachAttendance), [coachAttendance]);
  useEffect(() => writeStorage(KEYS.invoices, invoices), [invoices]);
  useEffect(() => writeStorage(KEYS.payroll, payroll), [payroll]);
  useEffect(() => writeStorage(KEYS.broadcasts, broadcasts), [broadcasts]);
  useEffect(() => writeStorage(KEYS.incidents, incidents), [incidents]);
  useEffect(() => writeStorage(KEYS.media, media), [media]);
  useEffect(() => writeStorage(KEYS.archivedStudents, archivedStudents), [archivedStudents]);

  /* ---------------- server sync ---------------- */
  /**
   * Pulls the role scoped view of the academy from the API. The server is the
   * source of truth, so this runs on sign in and whenever a screen needs the
   * freshest numbers.
   */
  const refreshFromServer = useCallback(async (showIndicator = false) => {
    if (!session) {
      isSharedStateReady.current = true;
      if (showIndicator) setIsSyncing(false);
      return;
    }

    if (showIndicator) setIsSyncing(true);
    try {
      const result = await apiGet<{ state: {
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
      } }>('/api/state');

      if (result.ok && result.data) {
        const state = result.data.state;
        lastSharedState.current = JSON.stringify(state);
        setStudents(state.students);
        setCoaches(state.coaches);
        setEnrollmentsState(state.enrollments);
        setCoachAssignments(state.coachAssignments);
        setAttendance(state.attendance);
        setAnnouncements(state.announcements);
        setArchivedStudents(state.archivedStudents);
        setBookings(state.bookings);
        setCoachAttendance(state.coachAttendance);
        setInvoices(state.invoices);
        setPayroll(state.payroll);
        setBroadcasts(state.broadcasts);
        setIncidents(state.incidents);
        setMedia(state.media);
        isSharedStateReady.current = true;
        return;
      }

      if (result.status === 401) {
        removeStorage(KEYS.session);
        removeStorage(KEYS.token);
        setSession(null);
        setCurrentUser(null);
        isSharedStateReady.current = true;
        return;
      }

      // Keep the app usable with cached local state when the API is temporarily
      // unavailable or the deployment is still initializing.
      isSharedStateReady.current = true;
    } catch (error) {
      // Ignore transient deploy-time or network issues so the app keeps using the
      // local fallback state until the server is reachable again.
      isSharedStateReady.current = true;
    } finally {
      if (showIndicator) setIsSyncing(false);
    }
  }, [session]);

  /* ---------------- session bootstrap ---------------- */
  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      // The token is persisted as JSON, so it has to be parsed back out before
      // it can be used as a bearer credential.
      const token = parseJSON<string>(readStorage(KEYS.token));
      if (!token) {
        if (!cancelled) {
          setSession(null);
          setCurrentUser(null);
          setIsReady(true);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!res.ok) {
          // Expired or revoked session: clear it so the shell can redirect.
          if (!cancelled) {
            removeStorage(KEYS.session);
            removeStorage(KEYS.token);
            setSession(null);
            setCurrentUser(null);
            setIsReady(true);
          }
          return;
        }

        const data = await res.json();
        if (cancelled) return;
        setSession(data.session);
        setCurrentUser(data.user);
        writeStorage(KEYS.session, data.session);
        setIsReady(true);
      } catch {
        if (!cancelled) {
          setSession(null);
          setCurrentUser(null);
          setIsReady(true);
        }
      }
    }

    resolveSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Pull the scoped academy data once the session is known.
  useEffect(() => {
    if (!session) return;
    void refreshFromServer(true);
  }, [session, refreshFromServer]);

  useEffect(() => {
    if (!session) return;

    const refresh = () => void refreshFromServer();
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [session, refreshFromServer]);

  // Keep the client session in sync with the signed token.
  useEffect(() => {
    if (session) writeStorage(KEYS.session, session);
  }, [session]);

  const signIn = useCallback(
    (payload: { user: User; token: string; expiresAt: number }) => {
      const nextSession: SessionPayload = {
        token: payload.token,
        role: payload.user.role,
        userId: payload.user.id,
        name: payload.user.name,
        issuedAt: Date.now(),
        expiresAt: payload.expiresAt,
      };
      writeStorage(KEYS.token, payload.token);
      writeStorage(KEYS.session, nextSession);
      setSession(nextSession);
      setCurrentUser(payload.user);
      setIsReady(true);
    },
    []
  );

  const signOut = useCallback(() => {
    removeStorage(KEYS.session);
    removeStorage(KEYS.token);
    setSession(null);
    setCurrentUser(null);
    addToast({ type: 'info', title: 'Signed out', description: 'Your session has been closed.' });
  }, []);

  /* ---------------- toasts ---------------- */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
      const id = `toast-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [{ ...toast, id, timestamp: new Date().toLocaleTimeString() }, ...prev].slice(0, 4));
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  const sharedState = useMemo(
    () => ({
      students,
      coaches,
      enrollments,
      coachAssignments,
      attendance,
      announcements,
      archivedStudents,
      facilities,
      bookings,
      coachAttendance,
      invoices,
      payroll,
      broadcasts,
      incidents,
      media,
    }),
    [
      students, coaches, enrollments, coachAssignments, attendance, announcements,
      archivedStudents, facilities, bookings, coachAttendance, invoices, payroll,
      broadcasts, incidents, media,
    ]
  );

  useEffect(() => {
    if (!isSharedStateReady.current || !currentRole) return;
    const serialized = JSON.stringify(sharedState);
    if (serialized === lastSharedState.current) return;

    const timer = window.setTimeout(async () => {
      const result = await apiPut('/api/state', { state: sharedState });
      if (result.ok) {
        lastSharedState.current = serialized;
      } else {
        addToast({
          type: 'error',
          title: 'Shared save failed',
          description: result.message,
        });
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [currentRole, sharedState, addToast]);

  /* ---------------- role scoped data ---------------- */
  const myStudent = useMemo(() => {
    if (currentRole !== 'STUDENT' || !session) return null;
    return students.find((s) => s.id === session.userId) ?? students.find((s) => s.id === currentUser?.studentId) ?? null;
  }, [currentRole, session, students, currentUser]);

  const myCoach = useMemo(() => {
    if (currentRole !== 'COACH' || !session) return null;
    return coaches.find((c) => c.userId === session.userId) ?? null;
  }, [currentRole, session, coaches]);

  const mySports = useMemo<SportId[]>(() => {
    if (currentRole === 'ADMIN') return SPORTS.map((s) => s.id);
    if (currentRole === 'COACH' && myCoach) {
      return coachAssignments
        .filter((a) => a.coachId === myCoach.id)
        .map((a) => a.sportId)
        .filter((id, index, list) => list.indexOf(id) === index);
    }
    if (currentRole === 'STUDENT' && myStudent) {
      return enrollments
        .filter((e) => e.studentId === myStudent.id && e.active)
        .map((e) => e.sportId)
        .filter((id, index, list) => list.indexOf(id) === index);
    }
    return [];
  }, [currentRole, myCoach, myStudent, coachAssignments, enrollments]);

  /** Students visible to the signed in role. */
  const visibleStudents = useMemo(() => {
    if (currentRole === 'ADMIN') return students;
    if (currentRole === 'COACH' && myCoach) {
      const sportIds = new Set(
        coachAssignments.filter((a) => a.coachId === myCoach.id).map((a) => a.sportId)
      );
      const allowed = new Set(
        enrollments.filter((e) => sportIds.has(e.sportId)).map((e) => e.studentId)
      );
      return students.filter((s) => allowed.has(s.id));
    }
    if (currentRole === 'STUDENT' && myStudent) return students.filter((s) => s.id === myStudent.id);
    return [];
  }, [currentRole, myCoach, myStudent, students, coachAssignments, enrollments]);

  const studentsForSport = useCallback(
    (sportId: SportId) => {
      const enrolled = new Set(
        enrollments.filter((e) => e.sportId === sportId && e.active).map((e) => e.studentId)
      );
      return visibleStudents.filter((s) => enrolled.has(s.id));
    },
    [enrollments, visibleStudents]
  );

  const sportNamesForStudent = useCallback(
    (studentId: string) =>
      enrollments
        .filter((e) => e.studentId === studentId && e.active)
        .map((e) => SPORTS.find((s) => s.id === e.sportId)?.name ?? e.sportId),
    [enrollments]
  );

  /* ---------------- attendance ---------------- */
  const attendanceForDate = useCallback(
    (date: string, sportId?: SportId) =>
      attendance.filter((a) => a.date === date && (!sportId || a.sportId === sportId)),
    [attendance]
  );

  const markAttendance = useCallback(
    async (
      date: string,
      sportId: SportId,
      entries: Array<{ studentId: string; status: AttendanceStatus }>
    ) => {
      if (currentRole === 'STUDENT') {
        return { success: false, message: 'Students cannot mark attendance.' };
      }
      if (currentRole === 'COACH' && !mySports.includes(sportId)) {
        return { success: false, message: 'You can only mark attendance for your assigned sports.' };
      }
      if (entries.length === 0) {
        return { success: false, message: 'There is nothing to save.' };
      }

      // The server is the source of truth: it re-checks the role, the coach
      // assignment and the enrolment before it writes anything.
      const result = await apiPost<{ records: AttendanceRecord[] }>('/api/attendance', {
        date,
        sportId,
        entries,
      });

      if (!result.ok || !result.data) {
        return { success: false, message: result.message };
      }

      const records = result.data.records;
      setAttendance((prev) => {
        const others = prev.filter((a) => !(a.date === date && a.sportId === sportId));
        return [...others, ...records];
      });

      return {
        success: true,
        message: result.message || `Saved ${entries.length} records for ${date}.`,
      };
    },
    [currentRole, mySports]
  );

  const markAllPresent = useCallback(
    async (date: string, sportId: SportId) => {
      if (currentRole === 'STUDENT') {
        return { success: false, message: 'Students cannot mark attendance.' };
      }
      if (currentRole === 'COACH' && !mySports.includes(sportId)) {
        return { success: false, message: 'You can only mark attendance for your assigned sports.' };
      }
      const studentIds = studentsForSport(sportId).map((s) => s.id);
      if (studentIds.length === 0) {
        return { success: false, message: 'No students are enrolled for this sport.' };
      }
      return markAttendance(
        date,
        sportId,
        studentIds.map((studentId) => ({ studentId, status: 'present' as AttendanceStatus }))
      );
    },
    [currentRole, mySports, studentsForSport, markAttendance]
  );

  const studentAttendanceSummary = useCallback(
    (studentId: string, month?: string): StudentAttendanceSummary => {
      const scoped = attendance.filter((a) => {
        if (a.studentId !== studentId) return false;
        if (!month) return true;
        return a.date.startsWith(month);
      });

      const present = scoped.filter((a) => a.status === 'present').length;
      const absent = scoped.filter((a) => a.status === 'absent').length;
      const total = present + absent;

      return {
        studentId,
        present,
        absent,
        total,
        percentage: total === 0 ? 0 : Math.round((present / total) * 100),
        byDate: scoped
          .slice()
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .map((a) => ({ date: a.date, sportId: a.sportId, status: a.status })),
      };
    },
    [attendance]
  );

  /* ---------------- directory mutations ---------------- */
  const addActiveStudent = useCallback(
    (studentData: Partial<ActiveStudent>): ActiveStudent => {
      const nextCodeNum = students.length + archivedStudents.length + 1;
      const formattedNum = String(nextCodeNum).padStart(3, '0');

      const newStudent: ActiveStudent = {
        id: `stu-active-${Date.now()}`,
        studentCode: `VEN-${formattedNum}`,
        loginId: formattedNum,
        password: 'vendhan',
        parentUserId: studentData.parentUserId || 'user-parent-1',
        parentName: studentData.parentName || 'Parent Guardian',
        parentPhone: studentData.parentPhone || '+19876543210',
        parentEmail: studentData.parentEmail || 'parent@example.com',
        firstName: studentData.firstName || 'Student',
        lastName: studentData.lastName || 'Athlete',
        dob: studentData.dob || '2014-01-01',
        gender: studentData.gender || 'Male',
        residentialAddress: studentData.residentialAddress || '742 Academy Drive',
        photoUrl:
          studentData.photoUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        bloodGroup: (studentData.bloodGroup as BloodGroup) || 'O+',
        medicalNotes: studentData.medicalNotes || 'No chronic restrictions.',
        chronicAilments: studentData.chronicAilments || [],
        allergies: studentData.allergies || [],
        emergencyDoctorContact: studentData.emergencyDoctorContact || {
          name: 'Academy Medical Desk',
          phone: '+15559870000',
          clinic: 'West Hills Sports Medicine',
        },
        digitalLiabilityWaiverSigned: studentData.digitalLiabilityWaiverSigned ?? true,
        waiverSignedDate: new Date().toISOString().split('T')[0],
        batchShift: studentData.batchShift || 'Morning 06:00 - 08:00 Squad',
        primaryAssignedCoachId: studentData.primaryAssignedCoachId || 'coach-1',
        primaryAssignedCoachName: studentData.primaryAssignedCoachName || 'Elena Rostova',
        dateOfJoining: studentData.dateOfJoining || new Date().toISOString().split('T')[0],
        isActive: true,
        achievements: studentData.achievements || [],
        skillRatings: studentData.skillRatings || {
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

      setStudents((prev) => [newStudent, ...prev]);
      addToast({
        type: 'success',
        title: 'Student registered',
        description: `Assigned ID ${newStudent.studentCode} to ${newStudent.firstName} ${newStudent.lastName}.`,
      });
      return newStudent;
    },
    [students, archivedStudents, addToast]
  );

  const updateActiveStudent = useCallback(
    (id: string, updates: Partial<ActiveStudent>) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only administrators can edit student profiles.' });
        return;
      }
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      addToast({ type: 'success', title: 'Profile updated', description: 'Changes saved.' });
    },
    [currentRole, addToast]
  );

  const updateCoachProfile = useCallback(
    (id: string, updates: Pick<Coach, 'bio' | 'phone' | 'certification'>) => {
      if (currentRole !== 'ADMIN' && (currentRole !== 'COACH' || myCoach?.id !== id)) {
        addToast({ type: 'error', title: 'Access denied', description: 'You may only edit your own coach profile.' });
        return;
      }
      setCoaches((prev) => prev.map((coach) => coach.id === id ? { ...coach, ...updates } : coach));
      addToast({ type: 'success', title: 'Coach profile updated', description: 'Changes are being saved to the shared academy record.' });
    },
    [currentRole, myCoach, addToast]
  );

  const archiveStudent = useCallback(
    (studentId: string, reason: ArchivedStudent['archivalReason'], exitNotes?: string) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only admins can archive students.' });
        return;
      }
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      const currentYear = new Date().getFullYear();
      const sportIds = enrollments.filter((e) => e.studentId === studentId).map((e) => e.sportId);

      const archived: ArchivedStudent = {
        id: `arch-${Date.now()}`,
        originalStudentId: student.id,
        studentCode: student.studentCode,
        fullName: `${student.firstName} ${student.lastName}`,
        parentDetails: {
          name: student.parentName,
          phone: student.parentPhone,
          email: student.parentEmail,
        },
        medicalHistory: {
          bloodGroup: student.bloodGroup,
          notes: student.medicalNotes,
          chronicAilments: student.chronicAilments,
        },
        enrolledSports: sportIds,
        achievements: student.achievements,
        cohortYears: `${student.dateOfJoining.slice(0, 4)}-${currentYear}`,
        archivalReason: reason,
        exitNotes: exitNotes || `Archived due to ${reason}.`,
        archivedAt: new Date().toISOString(),
        archivedBy: `${currentUser?.name ?? 'Admin'} (ADMIN)`,
      };

      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      setArchivedStudents((prev) => [archived, ...prev]);
      addToast({
        type: 'warning',
        title: 'Student archived',
        description: `${student.firstName} ${student.lastName} moved to the archive vault.`,
      });
    },
    [currentRole, students, enrollments, archivedStudents, currentUser, addToast]
  );

  const restoreArchivedStudent = useCallback(
    (archivedId: string) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only admins can restore students.' });
        return;
      }
      const record = archivedStudents.find((a) => a.id === archivedId);
      if (!record) return;

      const names = record.fullName.split(' ');
      const restored: ActiveStudent = {
        id: record.originalStudentId || `stu-restored-${Date.now()}`,
        studentCode: record.studentCode,
        loginId: record.studentCode.replace('VEN-', ''),
        password: undefined,
        parentUserId: 'user-parent-1',
        parentName: record.parentDetails.name,
        parentPhone: record.parentDetails.phone,
        parentEmail: record.parentDetails.email,
        firstName: names[0],
        lastName: names.slice(1).join(' ') || 'Athlete',
        dob: '2013-06-15',
        gender: 'Male',
        residentialAddress: '742 Academy Drive',
        photoUrl:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        bloodGroup: (record.medicalHistory.bloodGroup as BloodGroup) || 'O+',
        medicalNotes: record.medicalHistory.notes || 'No chronic restrictions.',
        chronicAilments: record.medicalHistory.chronicAilments || [],
        allergies: [],
        emergencyDoctorContact: {
          name: 'Academy Medical Desk',
          phone: '+15559870000',
          clinic: 'West Hills Sports Medicine',
        },
        digitalLiabilityWaiverSigned: true,
        waiverSignedDate: new Date().toISOString().split('T')[0],
        batchShift: 'Morning 06:00 - 08:00 Squad',
        primaryAssignedCoachId: 'coach-1',
        primaryAssignedCoachName: 'Elena Rostova',
        dateOfJoining: new Date().toISOString().split('T')[0],
        isActive: true,
        achievements: record.achievements || [],
        skillRatings: {
          stamina: 4,
          agility: 4,
          technique: 4,
          discipline: 4,
          lastUpdated: new Date().toISOString().split('T')[0],
          updatedByCoachName: 'Academy Staff',
          badges: ['Re-admitted'],
          coachFeedbackNotes: 'Re-admitted to the active training schedule.',
        },
      };

      setArchivedStudents((prev) => prev.filter((a) => a.id !== archivedId));
      setStudents((prev) => [restored, ...prev]);
      setEnrollmentsState((prev) => [
        ...prev,
        ...record.enrolledSports.map((sportId, index) => ({
          id: `en-${Date.now()}-${index}`,
          studentId: restored.id,
          sportId,
          joinedAt: new Date().toISOString().split('T')[0],
          active: true,
        })),
      ]);
      addToast({ type: 'success', title: 'Student restored', description: `${restored.firstName} is active again.` });
    },
    [currentRole, archivedStudents, addToast]
  );

  const setEnrollments = useCallback(
    (studentId: string, sportIds: SportId[]) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only admins can change enrolments.' });
        return;
      }
      setEnrollmentsState((prev) => {
        const others = prev.filter((e) => e.studentId !== studentId);
        const added = sportIds.map(
          (sportId, index) =>
            ({
              id: `en-${studentId}-${sportId}-${index}`,
              studentId,
              sportId,
              joinedAt: new Date().toISOString().split('T')[0],
              active: true,
            }) as Enrollment
        );
        return [...others, ...added];
      });
      addToast({ type: 'success', title: 'Enrolment updated', description: 'Sport list saved.' });
    },
    [currentRole, addToast]
  );

  /* ---------------- bulk ingestion ---------------- */
  const validateBulkIngestionData = useCallback(
    (rows: BulkIngestRow[]) => {
      const issues: IngestValidationIssue[] = [];
      const validRows: BulkIngestRow[] = [];
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const existingPhones = new Set(students.map((s) => s.parentPhone.replace(/\D/g, '')));
      const rowPhones = new Set<string>();

      rows.forEach((row, index) => {
        const rowNum = index + 1;
        let hasError = false;

        if (!row.full_name || row.full_name.trim().length < 2) {
          issues.push({
            row: rowNum,
            field: 'full_name',
            message: 'Full name is required.',
            severity: 'error',
            valueProvided: row.full_name,
          });
          hasError = true;
        }

        if (!row.dob || isNaN(Date.parse(row.dob))) {
          issues.push({
            row: rowNum,
            field: 'dob',
            message: 'Date of birth must be a valid date (YYYY-MM-DD).',
            severity: 'error',
            valueProvided: row.dob,
          });
          hasError = true;
        }

        if (!row.blood_group || !validBloodGroups.includes(row.blood_group.trim().toUpperCase())) {
          issues.push({
            row: rowNum,
            field: 'blood_group',
            message: `Invalid blood group. Allowed: ${validBloodGroups.join(', ')}`,
            severity: 'error',
            valueProvided: row.blood_group,
          });
          hasError = true;
        }

        if (!row.parent_phone || row.parent_phone.trim().length < 7) {
          issues.push({
            row: rowNum,
            field: 'parent_phone',
            message: 'Parent phone is required for emergency alerts.',
            severity: 'error',
            valueProvided: row.parent_phone,
          });
          hasError = true;
        } else {
          const clean = row.parent_phone.replace(/\D/g, '');
          if (existingPhones.has(clean) || rowPhones.has(clean)) {
            issues.push({
              row: rowNum,
              field: 'parent_phone',
              message: 'Duplicate parent phone number.',
              severity: 'warning',
              valueProvided: row.parent_phone,
            });
          }
          rowPhones.add(clean);
        }

        const sports = Array.isArray(row.enrolled_sports)
          ? row.enrolled_sports
          : typeof row.enrolled_sports === 'string'
            ? row.enrolled_sports.split(',').map((s) => s.trim())
            : [];

        const validSports = sports.filter((s): s is SportId => isSportId(s));
        if (validSports.length === 0) {
          issues.push({
            row: rowNum,
            field: 'enrolled_sports',
            message: `Pick at least one of: ${SPORTS.map((s) => s.name).join(', ')}.`,
            severity: 'error',
          });
          hasError = true;
        } else if (validSports.length !== sports.length) {
          issues.push({
            row: rowNum,
            field: 'enrolled_sports',
            message: 'Some sports are not offered by the academy and were dropped.',
            severity: 'warning',
          });
        }

        if (!hasError) validRows.push({ ...row, enrolled_sports: validSports });
      });

      return {
        validCount: validRows.length,
        errorCount: rows.length - validRows.length,
        issues,
        validRows,
      };
    },
    [students]
  );

  const executeBulkIngest = useCallback(
    async (validRows: BulkIngestRow[]) => {
      let inserted = 0;
      let errors = 0;
      const credentials: Array<{ studentCode: string; username: string; password: string }> = [];

      for (const row of validRows) {
        const nameParts = (row.full_name || 'Athlete').trim().split(/\s+/);
        const result = await apiPost<{
          student: { studentCode: string };
          credentials?: { username: string; password: string };
        }>('/api/students', {
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || 'Student',
          dob: row.dob,
          bloodGroup: row.blood_group?.toUpperCase(),
          medicalNotes: row.medical_notes,
          parentName: row.parent_name,
          parentPhone: row.parent_phone,
          parentEmail: row.parent_email,
          dateOfJoining: row.date_of_joining,
          sportIds: Array.isArray(row.enrolled_sports) ? row.enrolled_sports : [],
        });
        if (!result.ok || !result.data) {
          errors += 1;
          continue;
        }
        inserted += 1;
        if (result.data.credentials) {
          credentials.push({
            studentCode: result.data.student.studentCode,
            ...result.data.credentials,
          });
        }
      }

      await refreshFromServer();
      addToast({
        type: errors ? 'warning' : 'success',
        title: 'Import finished',
        description: `${inserted} student records created; ${errors} failed.`,
      });
      return { inserted, errors, credentials };
    },
    [refreshFromServer, addToast]
  );

  /* ---------------- coach actions ---------------- */
  const markBatchStudentAttendance = useCallback(
    async (
      records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
      batchName: string,
      sportId: SportId
    ) => {
      const today = toISODate(new Date());
      const result = await markAttendance(
        today,
        sportId,
        records.map((r) => ({ studentId: r.studentId, status: r.status }))
      );
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Attendance saved',
          description: `${records.length} students marked for ${batchName}.`,
        });
      }
      return result;
    },
    [markAttendance, addToast]
  );

  const recordCoachCheckIn = useCallback(
    (coachId: string, sessionType: 'Batch Training' | 'Private Coaching' | 'Clinic') => {
      if (currentRole !== 'COACH' || myCoach?.id !== coachId) {
        addToast({ type: 'error', title: 'Access denied', description: 'Only the signed-in coach can record a shift check-in.' });
        return;
      }
      const coach = coaches.find((c) => c.id === coachId);
      if (!coach) return;

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const today = toISODate(new Date());

      setCoachAttendance((prev) => [
        {
          id: `coach-att-${Date.now()}`,
          coachId,
          coachName: coach.name,
          date: today,
          checkInTime: timeStr,
          geofenceVerified: false,
          distanceFromAcademyMeters: 0,
          sessionType,
          isVerifiedForPayroll: false,
        },
        ...prev,
      ]);

      setCoaches((prev) =>
        prev.map((c) =>
          c.id === coachId
            ? {
                ...c,
                isCheckedInToday: true,
                lastCheckInTime: timeStr,
              }
            : c
        )
      );

      addToast({
        type: 'info',
        title: 'Check-in recorded',
        description: 'Location verification is not configured; this check-in is not verified for payroll.',
      });
    },
    [currentRole, myCoach, coaches, addToast]
  );

  const recordCoachCheckOut = useCallback(
    (coachId: string) => {
      if (currentRole !== 'COACH' || myCoach?.id !== coachId) {
        addToast({ type: 'error', title: 'Access denied', description: 'Only the signed-in coach can record a shift check-out.' });
        return;
      }
      const coach = coaches.find((c) => c.id === coachId);
      if (!coach) return;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setCoaches((prev) => prev.map((c) => (c.id === coachId ? { ...c, isCheckedInToday: false } : c)));
      setCoachAttendance((prev) =>
        prev.map((a) => (a.coachId === coachId && !a.checkOutTime ? { ...a, checkOutTime: timeStr } : a))
      );
      addToast({ type: 'info', title: 'Checked out', description: `${coach.name} ended the shift at ${timeStr}.` });
    },
    [currentRole, myCoach, coaches, addToast]
  );

  const updateStudentSkills = useCallback(
    (studentId: string, skills: Partial<ActiveStudent['skillRatings']>) => {
      if (currentRole !== 'COACH') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only coaches can update skill ratings.' });
        return;
      }
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                skillRatings: {
                  ...s.skillRatings,
                  ...skills,
                  lastUpdated: toISODate(new Date()),
                  updatedByCoachName: currentUser?.name ?? 'Academy Staff',
                },
              }
            : s
        )
      );
      addToast({ type: 'success', title: 'Skill matrix updated', description: 'Ratings recalculated.' });
    },
    [currentRole, currentUser, addToast]
  );

  const awardStudentAchievement = useCallback(
    (studentId: string, achievement: Omit<ActiveStudent['achievements'][number], 'id' | 'studentId'>) => {
      if (currentRole !== 'COACH') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only coaches can award student achievements.' });
        return;
      }
      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId
            ? {
                ...s,
                achievements: [
                  { ...achievement, id: `ach-${Date.now()}`, studentId },
                  ...s.achievements,
                ],
              }
            : s
        )
      );
      addToast({
        type: 'success',
        title: 'Achievement awarded',
        description: `“${achievement.title}” added to the student profile.`,
      });
    },
    [currentRole, addToast]
  );

  const createIncidentReport = useCallback(
    (incident: Omit<IncidentReport, 'id' | 'timestamp' | 'parentNotified' | 'parentNotificationSentAt'>) => {
      setIncidents((prev) => [
        {
          ...incident,
          id: `inc-${Date.now()}`,
          timestamp: new Date().toISOString(),
          parentNotified: false,
        },
        ...prev,
      ]);
      addToast({
        type: 'warning',
        title: `Incident logged (${incident.severity})`,
        description: `Report filed for ${incident.studentName}. Guardian notification was not sent.`,
      });
    },
    [addToast]
  );

  /* ---------------- facilities, finance, broadcast, media ---------------- */
  const createBooking = useCallback(
    (booking: Omit<FacilityBooking, 'id' | 'createdAt' | 'status'>) => {
      if (!currentUser || !currentRole) {
        return { success: false, message: 'Sign in before booking a facility.' };
      }
      if (booking.startTime >= booking.endTime || booking.date < toISODate(new Date())) {
        return { success: false, message: 'Choose a valid future date and time range.' };
      }
      const conflict = bookings.find(
        (b) =>
          b.facilityId === booking.facilityId &&
          b.date === booking.date &&
          b.status !== 'CANCELLED' &&
          ((booking.startTime >= b.startTime && booking.startTime < b.endTime) ||
            (booking.endTime > b.startTime && booking.endTime <= b.endTime) ||
            (booking.startTime <= b.startTime && booking.endTime >= b.endTime))
      );

      if (conflict) {
        return {
          success: false,
          message: `Slot taken: ${conflict.facilityName} is booked ${conflict.startTime} - ${conflict.endTime}.`,
        };
      }

      setBookings((prev) => [
        {
          ...booking,
          bookedByUserId: currentUser.id,
          bookedByName: currentUser.name,
          bookedByRole: currentRole,
          id: `book-${Date.now()}`,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      addToast({
        type: 'success',
        title: 'Slot booked',
        description: `${booking.facilityName} on ${booking.date}, ${booking.startTime} - ${booking.endTime}.`,
      });
      return { success: true, message: 'Reservation confirmed.' };
    },
    [bookings, currentRole, currentUser, addToast]
  );

  const cancelBooking = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((item) => item.id === bookingId);
      if (!booking || (currentRole !== 'ADMIN' && booking.bookedByUserId !== currentUser?.id)) {
        addToast({ type: 'error', title: 'Cannot cancel booking', description: 'You can only cancel your own bookings.' });
        return;
      }
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)));
      addToast({ type: 'info', title: 'Booking cancelled', description: 'The slot is free again.' });
    },
    [bookings, currentRole, currentUser, addToast]
  );

  const payInvoice = useCallback(
    async (invoiceId: string) => {
      const result = await apiPost<{ checkoutUrl: string }>('/api/payments/checkout', { invoiceId });
      if (!result.ok || !result.data) {
        addToast({ type: 'error', title: 'Payment unavailable', description: result.message });
        return;
      }
      window.location.assign(result.data.checkoutUrl);
    },
    [addToast]
  );

  const sendWhatsAppPaymentReminder = useCallback(
    async (invoiceId: string) => {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (!invoice) return;
      const result = await apiPost<{ message: string }>('/api/payments/reminder', { invoiceId });
      if (!result.ok || !result.data) {
        addToast({ type: 'error', title: 'Reminder not sent', description: result.message });
        return;
      }
      addToast({
        type: 'success',
        title: 'Reminder submitted',
        description: result.data.message,
      });
      await refreshFromServer();
    },
    [invoices, addToast, refreshFromServer]
  );

  const generateNewInvoice = useCallback(
    (invoice: Omit<StudentInvoice, 'id' | 'invoiceNumber'>) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only administrators can create invoices.' });
        return;
      }
      const newInvoice: StudentInvoice = {
        ...invoice,
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${invoices.length + 1001}`,
      };
      setInvoices((prev) => [newInvoice, ...prev]);
      addToast({
        type: 'success',
        title: 'Invoice created',
        description: `${newInvoice.invoiceNumber} for $${newInvoice.amount}.`,
      });
    },
    [currentRole, invoices, addToast]
  );

  const markPayrollDisbursed = useCallback(
    (payrollId: string) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only administrators can manage payroll.' });
        return;
      }
      setPayroll((prev) =>
        prev.map((p) =>
          p.id === payrollId
            ? { ...p, status: 'DISBURSED', disbursementDate: toISODate(new Date()) }
            : p
        )
      );
      addToast({ type: 'success', title: 'Payroll disbursed', description: 'Payslips generated.' });
    },
    [currentRole, addToast]
  );

  const sendEmergencyBroadcast = useCallback(
    async (broadcast: {
      targetType: 'ALL_PARENTS' | 'SPORT' | 'BATCH';
      targetValue?: string;
      templateKey: EmergencyBroadcast['templateKey'];
      templateTitle: string;
      messageContent: string;
      channel: 'WHATSAPP' | 'SMS_FALLBACK';
    }) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only administrators can prepare academy-wide broadcasts.' });
        return false;
      }
      const result = await apiPost<{ message: string }>('/api/broadcasts', broadcast);
      if (!result.ok || !result.data) {
        addToast({ type: 'error', title: 'Broadcast failed', description: result.message });
        return false;
      }
      addToast({ type: 'success', title: 'Broadcast submitted', description: result.data.message });
      await refreshFromServer();
      return true;
    },
    [currentRole, addToast, refreshFromServer]
  );

  const uploadMediaItem = useCallback(
    (item: Omit<MediaItem, 'id' | 'uploadedAt' | 'isApproved'>) => {
      setMedia((prev) => [
        { ...item, id: `med-${Date.now()}`, uploadedAt: toISODate(new Date()), isApproved: currentRole === 'ADMIN' },
        ...prev,
      ]);
      addToast({
        type: 'success',
        title: 'Media uploaded',
        description: currentRole === 'ADMIN' ? 'Published to the gallery.' : 'Sent for admin approval.',
      });
    },
    [currentRole, addToast]
  );

  const toggleApproveMedia = useCallback(
    (mediaId: string) => {
      if (currentRole !== 'ADMIN') {
        addToast({ type: 'error', title: 'Access denied', description: 'Only administrators can approve media.' });
        return;
      }
      setMedia((prev) => prev.map((m) => (m.id === mediaId ? { ...m, isApproved: !m.isApproved } : m)));
      addToast({ type: 'info', title: 'Gallery updated', description: 'Visibility changed.' });
    },
    [currentRole, addToast]
  );

  const resetAllData = useCallback(async () => {
    if (currentRole !== 'ADMIN') {
      addToast({ type: 'error', title: 'Access denied', description: 'Only administrators can reset academy data.' });
      return;
    }
    // The server store is the source of truth, so it has to be reset first.
    const result = await apiPost<unknown>('/api/reset', {});

    Object.values(KEYS).forEach((key) => removeStorage(key));
    setStudents(INITIAL_ACTIVE_STUDENTS);
    setCoaches(INITIAL_COACHES);
    setEnrollmentsState(INITIAL_ENROLLMENTS);
    setCoachAssignments(INITIAL_COACH_ASSIGNMENTS);
    setAttendance(buildInitialAttendance());
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setBookings(INITIAL_BOOKINGS);
    setCoachAttendance(INITIAL_COACH_ATTENDANCE);
    setInvoices(INITIAL_INVOICES);
    setPayroll(INITIAL_PAYROLL);
    setBroadcasts(INITIAL_BROADCASTS);
    setIncidents(INITIAL_INCIDENTS);
    setMedia(INITIAL_MEDIA);
    setArchivedStudents(INITIAL_ARCHIVED_STUDENTS);
    setSession(null);
    setCurrentUser(null);
    addToast({
      type: result.ok ? 'info' : 'warning',
      title: result.ok ? 'Academy data reset' : 'Local data reset',
      description: result.ok
        ? 'Everything is back to the seeded demo state.'
        : 'The server copy could not be reached, so only this device was reset.',
    });
  }, [currentRole, addToast]);

  const value: AppContextType = {
    session,
    currentUser,
    currentRole,
    isAuthenticated,
    isReady,
    signIn,
    signOut,

    students: visibleStudents,
    coaches,
    enrollments,
    coachAssignments,
    announcements,
    facilities,
    bookings,
    coachAttendance,
    invoices,
    payroll,
    broadcasts,
    incidents,
    media,
    archivedStudents: currentRole === 'ADMIN' ? archivedStudents : [],

    myStudent,
    myCoach,
    mySports,
    studentsForSport,
    sportNamesForStudent,

    attendance,
    attendanceForDate,
    markAttendance,
    markAllPresent,
    studentAttendanceSummary,
    isSyncing,
    refreshFromServer,

    addActiveStudent,
    updateActiveStudent,
    updateCoachProfile,
    archiveStudent,
    restoreArchivedStudent,
    setEnrollments,
    validateBulkIngestionData,
    executeBulkIngest,

    markBatchStudentAttendance,
    recordCoachCheckIn,
    recordCoachCheckOut,
    updateStudentSkills,
    awardStudentAchievement,
    createIncidentReport,

    createBooking,
    cancelBooking,
    payInvoice,
    sendWhatsAppPaymentReminder,
    generateNewInvoice,
    markPayrollDisbursed,
    sendEmergencyBroadcast,
    uploadMediaItem,
    toggleApproveMedia,

    toasts,
    addToast,
    removeToast,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export { roleHome };
