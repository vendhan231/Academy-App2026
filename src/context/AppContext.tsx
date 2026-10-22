import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActiveStudent,
  ArchivedStudent,
  Coach,
  Facility,
  FacilityBooking,
  StudentAttendanceRecord,
  CoachAttendanceRecord,
  StudentInvoice,
  CoachPayrollRecord,
  EmergencyBroadcast,
  IncidentReport,
  MediaItem,
  User,
  UserRole,
  AttendanceStatus,
  Achievement,
  SkillRating,
  BulkIngestRow,
  IngestValidationIssue,
  BloodGroup,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COACHES,
  INITIAL_ACTIVE_STUDENTS,
  INITIAL_ARCHIVED_STUDENTS,
  INITIAL_FACILITIES,
  INITIAL_BOOKINGS,
  INITIAL_STUDENT_ATTENDANCE,
  INITIAL_COACH_ATTENDANCE,
  INITIAL_INVOICES,
  INITIAL_PAYROLL,
  INITIAL_BROADCASTS,
  INITIAL_INCIDENTS,
  INITIAL_MEDIA,
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  timestamp: string;
}

interface AppContextType {
  // Auth state
  currentUser: User;
  currentRole: UserRole;
  activeChildId: string | null;
  activeChild: ActiveStudent | null;
  allUsers: User[];
  loginAsUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  setActiveChildId: (studentId: string) => void;

  // Data
  activeStudents: ActiveStudent[];
  archivedStudents: ArchivedStudent[]; // Guarded: only accessible if currentRole === 'ADMIN'
  coaches: Coach[];
  facilities: Facility[];
  bookings: FacilityBooking[];
  studentAttendance: StudentAttendanceRecord[];
  coachAttendance: CoachAttendanceRecord[];
  invoices: StudentInvoice[];
  payroll: CoachPayrollRecord[];
  broadcasts: EmergencyBroadcast[];
  incidents: IncidentReport[];
  media: MediaItem[];

  // Student Actions
  addActiveStudent: (studentData: Partial<ActiveStudent>) => ActiveStudent;
  updateActiveStudent: (id: string, updates: Partial<ActiveStudent>) => void;
  archiveStudent: (studentId: string, reason: ArchivedStudent['archivalReason'], exitNotes?: string) => void;
  restoreArchivedStudent: (archivedId: string) => void;
  validateBulkIngestionData: (rows: BulkIngestRow[]) => {
    validCount: number;
    errorCount: number;
    issues: IngestValidationIssue[];
    validRows: BulkIngestRow[];
  };
  executeBulkIngest: (validRows: BulkIngestRow[]) => { inserted: number; errors: number };

  // Attendance Actions
  markBatchStudentAttendance: (
    records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
    batchName: string,
    sport: string
  ) => void;
  recordCoachCheckIn: (coachId: string, sessionType: 'Batch Training' | 'Private Coaching' | 'Clinic') => void;
  recordCoachCheckOut: (coachId: string) => void;

  // Skill & Incident Actions
  updateStudentSkills: (studentId: string, skills: Partial<SkillRating>) => void;
  awardStudentAchievement: (studentId: string, achievement: Omit<Achievement, 'id' | 'studentId'>) => void;
  createIncidentReport: (incident: Omit<IncidentReport, 'id' | 'timestamp' | 'parentNotified' | 'parentNotificationSentAt'>) => void;

  // Facility Booking Actions
  createBooking: (booking: Omit<FacilityBooking, 'id' | 'createdAt' | 'status'>) => { success: boolean; message: string };
  cancelBooking: (bookingId: string) => void;

  // Finance Actions
  payInvoice: (invoiceId: string, paymentMethod: string) => void;
  sendWhatsAppPaymentReminder: (invoiceId: string) => void;
  generateNewInvoice: (invoice: Omit<StudentInvoice, 'id' | 'invoiceNumber'>) => void;
  markPayrollDisbursed: (payrollId: string) => void;

  // WhatsApp Broadcast Actions
  sendEmergencyBroadcast: (broadcast: {
    targetType: 'ALL_PARENTS' | 'SPORT' | 'BATCH';
    targetValue?: string;
    templateKey: EmergencyBroadcast['templateKey'];
    templateTitle: string;
    messageContent: string;
    channel: 'WHATSAPP' | 'SMS_FALLBACK';
  }) => void;

  // Media Actions
  uploadMediaItem: (item: Omit<MediaItem, 'id' | 'uploadedAt' | 'isApproved'>) => void;
  toggleApproveMedia: (mediaId: string) => void;

  // Notifications
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;

  // Simulator tools
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('apex_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.username) return parsed;
    }
    return INITIAL_USERS[0]; // Defaults to Vendhan (Director)
  });

  const [activeChildId, setActiveChildIdState] = useState<string | null>(() => {
    return localStorage.getItem('apex_active_child') || 'stu-active-001';
  });

  // Main collections with localStorage persistence
  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>(() => {
    const saved = localStorage.getItem('apex_students');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && parsed[0].studentCode?.startsWith('VEN-')) return parsed;
    }
    return INITIAL_ACTIVE_STUDENTS;
  });

  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>(() => {
    const saved = localStorage.getItem('apex_archived_students');
    return saved ? JSON.parse(saved) : INITIAL_ARCHIVED_STUDENTS;
  });

  const [coaches, setCoaches] = useState<Coach[]>(() => {
    const saved = localStorage.getItem('apex_coaches');
    return saved ? JSON.parse(saved) : INITIAL_COACHES;
  });

  const [facilities] = useState<Facility[]>(INITIAL_FACILITIES);

  const [bookings, setBookings] = useState<FacilityBooking[]>(() => {
    const saved = localStorage.getItem('apex_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('apex_student_att');
    return saved ? JSON.parse(saved) : INITIAL_STUDENT_ATTENDANCE;
  });

  const [coachAttendance, setCoachAttendance] = useState<CoachAttendanceRecord[]>(() => {
    const saved = localStorage.getItem('apex_coach_att');
    return saved ? JSON.parse(saved) : INITIAL_COACH_ATTENDANCE;
  });

  const [invoices, setInvoices] = useState<StudentInvoice[]>(() => {
    const saved = localStorage.getItem('apex_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [payroll, setPayroll] = useState<CoachPayrollRecord[]>(() => {
    const saved = localStorage.getItem('apex_payroll');
    return saved ? JSON.parse(saved) : INITIAL_PAYROLL;
  });

  const [broadcasts, setBroadcasts] = useState<EmergencyBroadcast[]>(() => {
    const saved = localStorage.getItem('apex_broadcasts');
    return saved ? JSON.parse(saved) : INITIAL_BROADCASTS;
  });

  const [incidents, setIncidents] = useState<IncidentReport[]>(() => {
    const saved = localStorage.getItem('apex_incidents');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  const [media, setMedia] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('apex_media');
    return saved ? JSON.parse(saved) : INITIAL_MEDIA;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('apex_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('apex_students', JSON.stringify(activeStudents));
  }, [activeStudents]);

  useEffect(() => {
    localStorage.setItem('apex_archived_students', JSON.stringify(archivedStudents));
  }, [archivedStudents]);

  useEffect(() => {
    localStorage.setItem('apex_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('apex_student_att', JSON.stringify(studentAttendance));
  }, [studentAttendance]);

  useEffect(() => {
    localStorage.setItem('apex_coach_att', JSON.stringify(coachAttendance));
  }, [coachAttendance]);

  useEffect(() => {
    localStorage.setItem('apex_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('apex_payroll', JSON.stringify(payroll));
  }, [payroll]);

  useEffect(() => {
    localStorage.setItem('apex_broadcasts', JSON.stringify(broadcasts));
  }, [broadcasts]);

  useEffect(() => {
    localStorage.setItem('apex_incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('apex_media', JSON.stringify(media));
  }, [media]);

  const addToast = (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth & Role helpers
  const currentRole = currentUser.role;

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'STUDENT_PARENT' && user.parentLinkedStudentIds && user.parentLinkedStudentIds.length > 0) {
      setActiveChildIdState(user.parentLinkedStudentIds[0]);
      localStorage.setItem('apex_active_child', user.parentLinkedStudentIds[0]);
    }
    addToast({
      type: 'info',
      title: `Logged in as ${user.name}`,
      description: `Role assigned: ${user.role} with RBAC policies enforced.`,
    });
  };

  const switchRole = (role: UserRole) => {
    const targetUser = INITIAL_USERS.find((u) => u.role === role);
    if (targetUser) {
      loginAsUser(targetUser);
    }
  };

  const setActiveChildId = (studentId: string) => {
    setActiveChildIdState(studentId);
    localStorage.setItem('apex_active_child', studentId);
    const child = activeStudents.find((s) => s.id === studentId);
    if (child) {
      addToast({
        type: 'info',
        title: `Switched Child Profile`,
        description: `Now viewing ${child.firstName} ${child.lastName}'s achievements, skills & schedule.`,
      });
    }
  };

  const activeChild = activeStudents.find((s) => s.id === activeChildId) || activeStudents[0] || null;

  // Active Students Actions
  const addActiveStudent = (studentData: Partial<ActiveStudent>): ActiveStudent => {
    const nextCodeNum = activeStudents.length + archivedStudents.length + 1;
    const formattedNum = String(nextCodeNum).padStart(3, '0');
    const studentCode = `VEN-${formattedNum}`;
    const newStudent: ActiveStudent = {
      id: `stu-active-${Date.now()}`,
      studentCode,
      loginId: formattedNum,
      password: 'vendhan',
      parentUserId: studentData.parentUserId || 'user-parent-1',
      parentName: studentData.parentName || 'Parent Name',
      parentPhone: studentData.parentPhone || '+19876543210',
      parentEmail: studentData.parentEmail || 'parent@example.com',
      firstName: studentData.firstName || 'Student',
      lastName: studentData.lastName || 'Athlete',
      dob: studentData.dob || '2014-01-01',
      gender: studentData.gender || 'Male',
      residentialAddress: studentData.residentialAddress || '123 Academy Blvd',
      photoUrl:
        studentData.photoUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bloodGroup: (studentData.bloodGroup as BloodGroup) || 'O+',
      medicalNotes: studentData.medicalNotes || 'No chronic restrictions.',
      chronicAilments: studentData.chronicAilments || [],
      allergies: studentData.allergies || [],
      emergencyDoctorContact: studentData.emergencyDoctorContact || {
        name: 'Dr. Gregory House, MD',
        phone: '+15559871234',
        clinic: 'West Hills Pediatric Sports Medicine',
      },
      digitalLiabilityWaiverSigned: studentData.digitalLiabilityWaiverSigned ?? true,
      waiverSignedDate: new Date().toISOString().split('T')[0],
      enrolledSports: studentData.enrolledSports || ['Tennis'],
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
        discipline: 4,
        lastUpdated: new Date().toISOString().split('T')[0],
        updatedByCoachName: 'Elena Rostova',
        badges: ['Academy Cadet'],
        coachFeedbackNotes: 'Newly onboarded student. Baseline assessment completed.',
      },
    };

    setActiveStudents((prev) => [newStudent, ...prev]);
    addToast({
      type: 'success',
      title: 'Active Student Registered',
      description: `Assigned ID ${studentCode} to ${newStudent.firstName} ${newStudent.lastName}.`,
    });
    return newStudent;
  };

  const updateActiveStudent = (id: string, updates: Partial<ActiveStudent>) => {
    setActiveStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    addToast({
      type: 'success',
      title: 'Student Profile Updated',
      description: 'Changes persisted to directory.',
    });
  };

  // Archive Student (Admin Exclusive)
  const archiveStudent = (
    studentId: string,
    reason: ArchivedStudent['archivalReason'],
    exitNotes?: string
  ) => {
    if (currentRole !== 'ADMIN') {
      addToast({
        type: 'error',
        title: 'RBAC Access Denied',
        description: 'Only Administrator roles can execute student archival operations.',
      });
      return;
    }

    const studentToArchive = activeStudents.find((s) => s.id === studentId);
    if (!studentToArchive) return;

    const currentYear = new Date().getFullYear();
    const cohortYears = `${studentToArchive.dateOfJoining.slice(0, 4)}-${currentYear}`;

    const archivedRecord: ArchivedStudent = {
      id: `arch-${Date.now()}`,
      originalStudentId: studentToArchive.id,
      studentCode: studentToArchive.studentCode,
      fullName: `${studentToArchive.firstName} ${studentToArchive.lastName}`,
      parentDetails: {
        name: studentToArchive.parentName,
        phone: studentToArchive.parentPhone,
        email: studentToArchive.parentEmail,
      },
      medicalHistory: {
        bloodGroup: studentToArchive.bloodGroup,
        notes: studentToArchive.medicalNotes,
        chronicAilments: studentToArchive.chronicAilments,
      },
      enrolledSports: studentToArchive.enrolledSports,
      achievements: studentToArchive.achievements,
      cohortYears,
      archivalReason: reason,
      exitNotes: exitNotes || `Archived due to ${reason}.`,
      archivedAt: new Date().toISOString(),
      archivedBy: `${currentUser.name} (${currentUser.role})`,
    };

    setActiveStudents((prev) => prev.filter((s) => s.id !== studentId));
    setArchivedStudents((prev) => [archivedRecord, ...prev]);

    addToast({
      type: 'warning',
      title: 'Student Archived',
      description: `${studentToArchive.firstName} ${studentToArchive.lastName} moved to Admin-Only Archives (${cohortYears}).`,
    });
  };

  // Restore Archived Student (Admin Exclusive)
  const restoreArchivedStudent = (archivedId: string) => {
    if (currentRole !== 'ADMIN') {
      addToast({
        type: 'error',
        title: 'RBAC Access Denied',
        description: 'Only Administrator roles can restore archived students.',
      });
      return;
    }

    const record = archivedStudents.find((a) => a.id === archivedId);
    if (!record) return;

    const names = record.fullName.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Athlete';

    const restored: ActiveStudent = {
      id: record.originalStudentId || `stu-restored-${Date.now()}`,
      studentCode: record.studentCode,
      parentUserId: 'user-parent-1',
      parentName: record.parentDetails.name,
      parentPhone: record.parentDetails.phone,
      parentEmail: record.parentDetails.email,
      firstName,
      lastName,
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
        name: 'Dr. Gregory House, MD',
        phone: '+15559871234',
        clinic: 'West Hills Pediatric Sports Medicine',
      },
      digitalLiabilityWaiverSigned: true,
      waiverSignedDate: new Date().toISOString().split('T')[0],
      enrolledSports: record.enrolledSports || ['Tennis'],
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
        updatedByCoachName: 'Elena Rostova',
        badges: ['Restored Athlete'],
        coachFeedbackNotes: 'Re-admitted to active training schedule.',
      },
    };

    setArchivedStudents((prev) => prev.filter((a) => a.id !== archivedId));
    setActiveStudents((prev) => [restored, ...prev]);

    addToast({
      type: 'success',
      title: 'Student Restored to Active',
      description: `${restored.firstName} ${restored.lastName} is now active in training batches.`,
    });
  };

  // Bulk Ingestion Engine Validation
  const validateBulkIngestionData = (rows: BulkIngestRow[]) => {
    const issues: IngestValidationIssue[] = [];
    const validRows: BulkIngestRow[] = [];
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const existingPhones = new Set(activeStudents.map((s) => s.parentPhone.replace(/\D/g, '')));
    const rowPhones = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      let hasError = false;

      // Full Name
      if (!row.full_name || row.full_name.trim().length < 2) {
        issues.push({
          row: rowNum,
          field: 'full_name',
          message: 'Full Name is required and must be at least 2 characters.',
          severity: 'error',
          valueProvided: row.full_name,
        });
        hasError = true;
      }

      // DOB
      if (!row.dob || isNaN(Date.parse(row.dob))) {
        issues.push({
          row: rowNum,
          field: 'dob',
          message: 'Date of Birth must be a valid ISO format (YYYY-MM-DD).',
          severity: 'error',
          valueProvided: row.dob,
        });
        hasError = true;
      }

      // Blood Group
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

      // Parent Phone
      if (!row.parent_phone || row.parent_phone.trim().length < 7) {
        issues.push({
          row: rowNum,
          field: 'parent_phone',
          message: 'Parent Phone is required for WhatsApp emergency alerts.',
          severity: 'error',
          valueProvided: row.parent_phone,
        });
        hasError = true;
      } else {
        const cleanPhone = row.parent_phone.replace(/\D/g, '');
        if (existingPhones.has(cleanPhone) || rowPhones.has(cleanPhone)) {
          issues.push({
            row: rowNum,
            field: 'parent_phone',
            message: 'Duplicate parent phone number detected.',
            severity: 'warning',
            valueProvided: row.parent_phone,
          });
        }
        rowPhones.add(cleanPhone);
      }

      // Enrolled Sports
      if (!row.enrolled_sports || (Array.isArray(row.enrolled_sports) && row.enrolled_sports.length === 0)) {
        issues.push({
          row: rowNum,
          field: 'enrolled_sports',
          message: 'At least one sport must be specified.',
          severity: 'error',
        });
        hasError = true;
      }

      if (!hasError) {
        validRows.push(row);
      }
    });

    return {
      validCount: validRows.length,
      errorCount: rows.length - validRows.length,
      issues,
      validRows,
    };
  };

  const executeBulkIngest = (validRows: BulkIngestRow[]) => {
    let inserted = 0;
    const newStudents: ActiveStudent[] = [];

    validRows.forEach((row, i) => {
      const names = (row.full_name || 'Athlete').trim().split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'Student';
      const nextCodeNum = activeStudents.length + archivedStudents.length + i + 1;
      const formattedNum = String(nextCodeNum).padStart(3, '0');
      const studentCode = `VEN-${formattedNum}`;

      let sports: string[] = [];
      if (Array.isArray(row.enrolled_sports)) {
        sports = row.enrolled_sports;
      } else if (typeof row.enrolled_sports === 'string') {
        sports = row.enrolled_sports.split(',').map((s) => s.trim());
      } else {
        sports = ['Tennis'];
      }

      const newStudent: ActiveStudent = {
        id: `stu-bulk-${Date.now()}-${i}`,
        studentCode,
        loginId: formattedNum,
        password: 'vendhan',
        parentUserId: 'user-parent-1',
        parentName: row.parent_name || 'Parent Guardian',
        parentPhone: row.parent_phone || '+19876543210',
        parentEmail: row.parent_email || 'parent@example.com',
        firstName,
        lastName,
        dob: row.dob || '2013-05-10',
        gender: 'Male',
        residentialAddress: 'Academy District',
        photoUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        bloodGroup: (row.blood_group?.trim().toUpperCase() as BloodGroup) || 'O+',
        medicalNotes: row.medical_notes || 'No restrictions logged during bulk import.',
        chronicAilments: [],
        allergies: [],
        emergencyDoctorContact: {
          name: 'Academy Medical Desk',
          phone: '+15559870000',
          clinic: 'Apex Sports Clinic',
        },
        digitalLiabilityWaiverSigned: true,
        waiverSignedDate: new Date().toISOString().split('T')[0],
        enrolledSports: sports,
        batchShift: 'Morning 06:00 - 08:00 Squad',
        primaryAssignedCoachId: 'coach-1',
        primaryAssignedCoachName: 'Elena Rostova',
        dateOfJoining: row.date_of_joining || new Date().toISOString().split('T')[0],
        isActive: true,
        achievements: (row.achievements || []).map((a, idx) => ({
          id: `ach-bulk-${Date.now()}-${idx}`,
          studentId: '',
          title: a.title,
          sport: a.sport,
          category: 'Tournament',
          description: `Imported record: ${a.title} (${a.year})`,
          awardedDate: `${a.year}-06-01`,
          coachName: 'Apex Academy Staff',
          medalType: 'Badge',
        })),
        skillRatings: {
          stamina: 3,
          agility: 3,
          technique: 3,
          discipline: 4,
          lastUpdated: new Date().toISOString().split('T')[0],
          updatedByCoachName: 'Elena Rostova',
          badges: ['Ingested Athlete'],
          coachFeedbackNotes: 'Imported via Bulk Ingestion Pipeline.',
        },
      };

      newStudents.push(newStudent);
      inserted++;
    });

    setActiveStudents((prev) => [...newStudents, ...prev]);
    addToast({
      type: 'success',
      title: 'Bulk Ingestion Complete',
      description: `Successfully inserted ${inserted} student records into Active Directory with verified schemas.`,
    });

    return { inserted, errors: 0 };
  };

  // Student Attendance
  const markBatchStudentAttendance = (
    records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
    batchName: string,
    sport: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const newRecords: StudentAttendanceRecord[] = records.map((rec) => {
      const student = activeStudents.find((s) => s.id === rec.studentId);
      return {
        id: `att-${Date.now()}-${rec.studentId}`,
        date: today,
        studentId: rec.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        batchName,
        sport,
        status: rec.status,
        markedByCoachId: currentUser.coachId || 'coach-1',
        markedByCoachName: currentUser.name,
        markedAt: new Date().toISOString(),
        notes: rec.notes,
      };
    });

    // Remove duplicates for today + batch
    setStudentAttendance((prev) => [
      ...newRecords,
      ...prev.filter(
        (p) =>
          !(
            p.date === today &&
            records.some((r) => r.studentId === p.studentId)
          )
      ),
    ]);

    addToast({
      type: 'success',
      title: 'Attendance Saved',
      description: `Marked attendance for ${records.length} students in ${batchName}.`,
    });
  };

  // Coach Attendance (Geofenced Check-in / Out)
  const recordCoachCheckIn = (
    coachId: string,
    sessionType: 'Batch Training' | 'Private Coaching' | 'Clinic'
  ) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return;

    // Simulate GPS geofence calculation within 100 meters
    const simulatedDistance = Math.floor(Math.random() * 60) + 15;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = now.toISOString().split('T')[0];

    const newRecord: CoachAttendanceRecord = {
      id: `coach-att-${Date.now()}`,
      coachId,
      coachName: coach.name,
      date: today,
      checkInTime: timeStr,
      geofenceVerified: true,
      distanceFromAcademyMeters: simulatedDistance,
      sessionType,
      isVerifiedForPayroll: true,
    };

    setCoachAttendance((prev) => [newRecord, ...prev]);

    // Update coach verified sessions
    setCoaches((prev) =>
      prev.map((c) =>
        c.id === coachId
          ? {
              ...c,
              isCheckedInToday: true,
              lastCheckInTime: timeStr,
              verifiedSessionsThisMonth: c.verifiedSessionsThisMonth + 1,
            }
          : c
      )
    );

    // Update payroll record
    setPayroll((prev) =>
      prev.map((p) => {
        if (p.coachId === coachId) {
          const newSessions = p.verifiedSessions + 1;
          const newPayout = newSessions * p.perSessionRate;
          return {
            ...p,
            verifiedSessions: newSessions,
            totalSessionPayout: newPayout,
            totalDisbursed: p.baseSalary + newPayout + p.bonuses,
          };
        }
        return p;
      })
    );

    addToast({
      type: 'success',
      title: 'Geofence Verified Check-in',
      description: `${coach.name} checked in (${simulatedDistance}m from Academy grounds). Verified for payroll engine.`,
    });
  };

  const recordCoachCheckOut = (coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    if (!coach) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCoaches((prev) =>
      prev.map((c) => (c.id === coachId ? { ...c, isCheckedInToday: false } : c))
    );

    setCoachAttendance((prev) =>
      prev.map((a) =>
        a.coachId === coachId && !a.checkOutTime ? { ...a, checkOutTime: timeStr } : a
      )
    );

    addToast({
      type: 'info',
      title: 'Coach Check-out Logged',
      description: `${coach.name} completed shift at ${timeStr}.`,
    });
  };

  // Skill & Incident Updates
  const updateStudentSkills = (studentId: string, skills: Partial<SkillRating>) => {
    setActiveStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            skillRatings: {
              ...s.skillRatings,
              ...skills,
              lastUpdated: new Date().toISOString().split('T')[0],
              updatedByCoachName: currentUser.name,
            },
          };
        }
        return s;
      })
    );

    addToast({
      type: 'success',
      title: 'Skill Matrix Updated',
      description: 'Ratings (Stamina, Agility, Technique, Discipline) recalculated.',
    });
  };

  const awardStudentAchievement = (
    studentId: string,
    achievement: Omit<Achievement, 'id' | 'studentId'>
  ) => {
    const newAchievement: Achievement = {
      ...achievement,
      id: `ach-${Date.now()}`,
      studentId,
    };

    setActiveStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            achievements: [newAchievement, ...s.achievements],
          };
        }
        return s;
      })
    );

    addToast({
      type: 'success',
      title: 'Achievement Bestowed!',
      description: `Awarded "${achievement.title}" to student profile.`,
    });
  };

  const createIncidentReport = (
    incident: Omit<IncidentReport, 'id' | 'timestamp' | 'parentNotified' | 'parentNotificationSentAt'>
  ) => {
    const newReport: IncidentReport = {
      ...incident,
      id: `inc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      parentNotified: true,
      parentNotificationSentAt: new Date().toISOString(),
    };

    setIncidents((prev) => [newReport, ...prev]);

    addToast({
      type: 'warning',
      title: `Incident Logged (${incident.severity} Severity)`,
      description: `Report filed for ${incident.studentName}. WhatsApp alert dispatched to primary guardian.`,
    });
  };

  // Facility Bookings
  const createBooking = (
    booking: Omit<FacilityBooking, 'id' | 'createdAt' | 'status'>
  ): { success: boolean; message: string } => {
    // Conflict detection
    const conflict = bookings.find(
      (b) =>
        b.facilityId === booking.facilityId &&
        b.date === booking.date &&
        b.status !== 'CANCELLED' &&
        ((booking.startTime >= b.startTime && booking.startTime < b.endTime) ||
          (booking.endTime > b.startTime && booking.endTime <= b.endTime) ||
          (booking.startTime <= b.startTime && booking.endTime >= b.endTime))
    );

    if (conflict && currentRole !== 'ADMIN') {
      return {
        success: false,
        message: `Slot Conflict: ${conflict.facilityName} is already booked from ${conflict.startTime} to ${conflict.endTime} by ${conflict.bookedByName}.`,
      };
    }

    const newBooking: FacilityBooking = {
      ...booking,
      id: `book-${Date.now()}`,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    addToast({
      type: 'success',
      title: 'Court / Facility Confirmed',
      description: `Reserved ${booking.facilityName} on ${booking.date} (${booking.startTime} - ${booking.endTime}).`,
    });

    return { success: true, message: 'Reservation confirmed.' };
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
    );
    addToast({
      type: 'info',
      title: 'Reservation Cancelled',
      description: 'Court slot released for booking.',
    });
  };

  // Fees & Invoices
  const payInvoice = (invoiceId: string, paymentMethod: string) => {
    const txId = `tx_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'PAID',
              paidAt: new Date().toISOString(),
              paymentMethod,
              transactionId: txId,
            }
          : inv
      )
    );

    addToast({
      type: 'success',
      title: 'Payment Processed Successfully',
      description: `Receipt generated. Transaction ID: ${txId}.`,
    });
  };

  const sendWhatsAppPaymentReminder = (invoiceId: string) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    addToast({
      type: 'info',
      title: 'WhatsApp Reminder Triggered',
      description: `Payment link & invoice details sent to ${invoice.parentName} (${invoice.parentPhone}).`,
    });
  };

  const generateNewInvoice = (invoice: Omit<StudentInvoice, 'id' | 'invoiceNumber'>) => {
    const num = invoices.length + 1001;
    const newInv: StudentInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${num}`,
    };
    setInvoices((prev) => [newInv, ...prev]);
    addToast({
      type: 'success',
      title: 'Invoice Generated',
      description: `Created invoice ${newInv.invoiceNumber} for $${newInv.amount}.`,
    });
  };

  const markPayrollDisbursed = (payrollId: string) => {
    setPayroll((prev) =>
      prev.map((p) =>
        p.id === payrollId
          ? { ...p, status: 'DISBURSED', disbursementDate: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    addToast({
      type: 'success',
      title: 'Payroll Disbursed',
      description: 'Funds cleared and payslips generated for coach accounts.',
    });
  };

  // WhatsApp Emergency Broadcast Subsystem
  const sendEmergencyBroadcast = (broadcast: {
    targetType: 'ALL_PARENTS' | 'SPORT' | 'BATCH';
    targetValue?: string;
    templateKey: EmergencyBroadcast['templateKey'];
    templateTitle: string;
    messageContent: string;
    channel: 'WHATSAPP' | 'SMS_FALLBACK';
  }) => {
    // Calculate recipients
    let recipients = activeStudents.length;
    if (broadcast.targetType === 'SPORT' && broadcast.targetValue) {
      recipients = activeStudents.filter((s) => s.enrolledSports.includes(broadcast.targetValue!)).length;
    } else if (broadcast.targetType === 'BATCH' && broadcast.targetValue) {
      recipients = activeStudents.filter((s) => s.batchShift === broadcast.targetValue).length;
    }
    if (recipients === 0) recipients = 1;

    const newBroadcast: EmergencyBroadcast = {
      id: `bcast-${Date.now()}`,
      senderName: `${currentUser.name} (${currentUser.role})`,
      senderRole: currentUser.role,
      targetCriteria: {
        targetType: broadcast.targetType,
        targetValue: broadcast.targetValue,
      },
      templateKey: broadcast.templateKey,
      templateTitle: broadcast.templateTitle,
      messageContent: broadcast.messageContent,
      channel: broadcast.channel,
      recipientCount: recipients,
      deliveredCount: recipients,
      readCount: Math.floor(recipients * 0.94),
      sentAt: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
    };

    setBroadcasts((prev) => [newBroadcast, ...prev]);
    addToast({
      type: 'warning',
      title: '🚨 WhatsApp Emergency Broadcast Dispatched',
      description: `Delivered to ${recipients} guardians using Meta HSM template "${broadcast.templateTitle}".`,
    });
  };

  // Media Gallery
  const uploadMediaItem = (item: Omit<MediaItem, 'id' | 'uploadedAt' | 'isApproved'>) => {
    const newItem: MediaItem = {
      ...item,
      id: `med-${Date.now()}`,
      uploadedAt: new Date().toISOString().split('T')[0],
      isApproved: currentRole === 'ADMIN', // auto-approve if admin
    };
    setMedia((prev) => [newItem, ...prev]);
    addToast({
      type: 'success',
      title: 'Media Uploaded',
      description: currentRole === 'ADMIN' ? 'Published to gallery.' : 'Submitted for Admin moderation.',
    });
  };

  const toggleApproveMedia = (mediaId: string) => {
    setMedia((prev) =>
      prev.map((m) => (m.id === mediaId ? { ...m, isApproved: !m.isApproved } : m))
    );
    addToast({
      type: 'info',
      title: 'Media Status Updated',
      description: 'Visibility updated in gallery.',
    });
  };

  const resetAllData = () => {
    localStorage.clear();
    setCurrentUser(INITIAL_USERS[0]);
    setActiveStudents(INITIAL_ACTIVE_STUDENTS);
    setArchivedStudents(INITIAL_ARCHIVED_STUDENTS);
    setCoaches(INITIAL_COACHES);
    setBookings(INITIAL_BOOKINGS);
    setStudentAttendance(INITIAL_STUDENT_ATTENDANCE);
    setCoachAttendance(INITIAL_COACH_ATTENDANCE);
    setInvoices(INITIAL_INVOICES);
    setPayroll(INITIAL_PAYROLL);
    setBroadcasts(INITIAL_BROADCASTS);
    setIncidents(INITIAL_INCIDENTS);
    setMedia(INITIAL_MEDIA);
    setActiveChildIdState('stu-active-001');
    addToast({
      type: 'info',
      title: 'Vendhan Sports Academy Reset',
      description: 'Default state restored: Admin (admin/admin123), Coach (coach/coach123), and Student (001/vendhan).',
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        activeChildId,
        activeChild,
        allUsers: INITIAL_USERS,
        loginAsUser,
        switchRole,
        setActiveChildId,
        activeStudents,
        archivedStudents: currentRole === 'ADMIN' ? archivedStudents : [], // RBAC ENFORCED: Zero visibility for Coach & Parent
        coaches,
        facilities,
        bookings,
        studentAttendance,
        coachAttendance,
        invoices,
        payroll,
        broadcasts,
        incidents,
        media,
        addActiveStudent,
        updateActiveStudent,
        archiveStudent,
        restoreArchivedStudent,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
