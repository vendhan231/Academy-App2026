export type UserRole = 'ADMIN' | 'COACH' | 'STUDENT_PARENT';

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
  parentLinkedStudentIds?: string[]; // student IDs associated with this parent
}

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  sport: string;
  category: 'Tournament' | 'Skill Badge' | 'Milestone' | 'Personal Best';
  description: string;
  awardedDate: string;
  coachName: string;
  medalType?: 'Gold' | 'Silver' | 'Bronze' | 'Badge' | 'Trophy';
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
  parentEmail: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  residentialAddress: string;
  photoUrl: string;
  bloodGroup: BloodGroup;
  medicalNotes: string;
  chronicAilments: string[]; // e.g. ["Asthma", "Dust allergy"]
  allergies: string[];
  emergencyDoctorContact: EmergencyDoctorContact;
  digitalLiabilityWaiverSigned: boolean;
  waiverSignedDate?: string;
  enrolledSports: string[];
  batchShift: string; // e.g. "Morning 06:00 - 08:00 Squad", "Evening Elite 16:30 - 18:30"
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
  enrolledSports: string[];
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
  sports: string[];
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
  sport: string;
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
  sport: string;
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

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'MEDICAL_LEAVE';

export interface StudentAttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  batchName: string;
  sport: string;
  status: AttendanceStatus;
  markedByCoachId: string;
  markedByCoachName: string;
  markedAt: string;
  notes?: string;
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
  sportsIncluded: string[];
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
  sport: string;
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
  sport: string;
  mediaUrl: string;
  thumbnailUrl: string;
  category: 'Match' | 'Training' | 'Award Ceremony' | 'Clinic';
  uploadedBy: string;
  uploadedAt: string;
  taggedStudentNames: string[];
  isApproved: boolean;
}

export interface BulkIngestRow {
  full_name?: string;
  dob?: string;
  blood_group?: string;
  medical_notes?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  enrolled_sports?: string[] | string;
  date_of_joining?: string;
  achievements?: Array<{ title: string; sport: string; year: number }>;
}

export interface IngestValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  valueProvided?: string;
}
