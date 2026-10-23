import { SportId } from '../lib/sports';

export type UserRole = 'ADMIN' | 'COACH' | 'STUDENT';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  role: UserRole;
  phoneNumber: string;
  email?: string;
  username?: string;
  password?: string;
  name: string;
  avatar: string;
  mfaEnabled?: boolean;
  coachId?: string;
  studentId?: string;
  parentLinkedStudentIds?: string[];
}

/** A student enrolled in one or more sports. */
export interface Enrollment {
  id: string;
  studentId: string;
  sportId: SportId;
  joinedAt: string;
  active: boolean;
}

/** A coach assigned to teach one or more sports. */
export interface CoachAssignment {
  id: string;
  coachId: string;
  sportId: SportId;
}

/** Attendance is recorded per day, per sport, per student. */
export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  sportId: SportId;
  studentId: string;
  status: AttendanceStatus;
  markedBy: string; // user id of the coach or admin
  markedAt: string; // ISO timestamp
}

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  sport: SportId;
  category: 'Tournament' | 'Skill Badge' | 'Milestone' | 'Personal Best';
  description: string;
  awardedDate: string;
  coachName: string;
  medalType?: 'Gold' | 'Silver' | 'Bronze' | 'Badge' | 'Trophy';
  photoUrl?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkillRating {
  stamina: number; // 1-5
  agility: number; // 1-5
  technique: number; // 1-5
  discipline: number; // 1-5
  lastUpdated: string;
  updatedByCoachName: string;
  badges: string[];
  coachFeedbackNotes: string;
}

export interface EmergencyDoctorContact {
  name: string;
  phone: string;
  clinic: string;
}

export interface ActiveStudent {
  id: string;
  studentCode: string; // e.g. "VEN-001"
  loginId?: string; // e.g. "001"
  password?: string; // "vendhan"
  parentUserId: string;
  parentName: string;
  parentPhone: string;
  parentMessagingConsentAt?: string;
  parentEmail: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  residentialAddress: string;
  photoUrl: string;
  bloodGroup: BloodGroup;
  medicalNotes: string;
  chronicAilments: string[];
  allergies: string[];
  emergencyDoctorContact: EmergencyDoctorContact;
  digitalLiabilityWaiverSigned: boolean;
  waiverSignedDate?: string;
  batchShift: string;
  primaryAssignedCoachId: string;
  primaryAssignedCoachName: string;
  dateOfJoining: string;
  isActive: boolean;
  achievements: Achievement[];
  skillRatings: SkillRating;
}

export interface ArchivedStudent {
  id: string;
  originalStudentId: string;
  studentCode: string;
  fullName: string;
  parentDetails: {
    name: string;
    phone: string;
    email: string;
  };
  medicalHistory: {
    bloodGroup: string;
    notes: string;
    chronicAilments?: string[];
  };
  enrolledSports: SportId[];
  achievements: Achievement[];
  cohortYears: string; // e.g. "2024-2025", "2025-2026"
  archivalReason: 'Graduated' | 'Relocated' | 'Dropped Out' | 'Transferred';
  exitNotes?: string;
  archivedAt: string;
  archivedBy: string;
}

export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  certification: string;
  avatar: string;
  baseSalary: number;
  perSessionRate: number;
  verifiedSessionsThisMonth: number;
  bio: string;
  isCheckedInToday: boolean;
  lastCheckInTime?: string;
}

export interface Facility {
  id: string;
  name: string;
  sport: SportId;
  type: 'Court' | 'Field' | 'Pool' | 'Track' | 'Studio';
  maxPlayers: number;
  bufferMinutes: number;
  openingHour: number; // e.g. 6 (6 AM)
  closingHour: number; // e.g. 22 (10 PM)
  imageUrl: string;
}

export interface FacilityBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  sport: SportId;
  bookedByUserId: string;
  bookedByName: string;
  bookedByRole: UserRole;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export interface CoachAttendanceRecord {
  id: string;
  coachId: string;
  coachName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  geofenceVerified: boolean;
  distanceFromAcademyMeters: number;
  sessionType: 'Batch Training' | 'Private Coaching' | 'Clinic';
  isVerifiedForPayroll: boolean;
}

export interface StudentInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  amount: number;
  period: string; // e.g. "October 2026", "Q4 2026"
  sportsIncluded: SportId[];
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
}

export interface CoachPayrollRecord {
  id: string;
  coachId: string;
  coachName: string;
  month: string;
  baseSalary: number;
  perSessionRate: number;
  verifiedSessions: number;
  totalSessionPayout: number;
  bonuses: number;
  totalDisbursed: number;
  status: 'PENDING' | 'DISBURSED';
  disbursementDate?: string;
}

export interface EmergencyBroadcast {
  id: string;
  senderName: string;
  senderRole: UserRole;
  targetCriteria: {
    targetType: 'ALL_PARENTS' | 'SPORT' | 'BATCH';
    targetValue?: string;
  };
  templateKey: 'WEATHER_CLOSURE' | 'VENUE_CHANGE' | 'TRANSPORT_DELAY' | 'URGENT_MEDICAL' | 'TOURNAMENT_ALERT' | 'CUSTOM';
  templateTitle: string;
  messageContent: string;
  channel: 'WHATSAPP' | 'SMS_FALLBACK';
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  sentAt: string;
  deliveryStatus: 'DELIVERED' | 'FAILED_OVER_TO_SMS' | 'IN_TRANSIT';
}

export interface IncidentReport {
  id: string;
  studentId: string;
  studentName: string;
  sport: SportId;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  bodyPart: string;
  description: string;
  treatmentGiven: string;
  reportedByCoachName: string;
  parentNotified: boolean;
  parentNotificationSentAt?: string;
  followUpRequired: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  sport: SportId;
  mediaUrl: string;
  thumbnailUrl: string;
  category: 'Match' | 'Training' | 'Award Ceremony' | 'Clinic';
  uploadedBy: string;
  uploadedAt: string;
  taggedStudentNames: string[];
  isApproved: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'ALL' | UserRole;
  sportId?: SportId;
  createdAt: string;
  authorName: string;
  pinned?: boolean;
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface BulkIngestRow {
  full_name?: string;
  dob?: string;
  blood_group?: string;
  medical_notes?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  enrolled_sports?: SportId[] | string;
  date_of_joining?: string;
  achievements?: Array<{ title: string; sport: SportId; year: number }>;
}

export interface IngestValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  valueProvided?: string;
}

/** Aggregated attendance for one student over a period. */
export interface StudentAttendanceSummary {
  studentId: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  byDate: Array<{
    date: string;
    sportId: SportId;
    status: AttendanceStatus;
  }>;
}
