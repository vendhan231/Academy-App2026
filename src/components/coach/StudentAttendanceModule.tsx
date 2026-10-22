import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Heart,
  Save,
  CheckCheck,
  Calendar,
  Users,
} from 'lucide-react';

export const StudentAttendanceModule: React.FC = () => {
  const { activeStudents, markBatchStudentAttendance, studentAttendance } = useApp();

  const [selectedBatch, setSelectedBatch] = useState('Morning 06:00 - 08:00 Squad');
  const [selectedSport, setSelectedSport] = useState('Tennis');

  // Filter students for batch/sport
  const batchStudents = activeStudents.filter(
    (s) => s.batchShift === selectedBatch || s.enrolledSports.includes(selectedSport)
  );

  // Local state for current attendance sheet
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>(() => {
    const map: Record<string, { status: AttendanceStatus; notes: string }> = {};
    activeStudents.forEach((s) => {
      map[s.id] = { status: 'PRESENT', notes: '' };
    });
    return map;
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      batchStudents.forEach((s) => {
        updated[s.id] = { ...(updated[s.id] || {}), status: 'PRESENT', notes: '' };
      });
      return updated;
    });
  };

  const handleSaveAttendance = () => {
    const records = batchStudents.map((s) => ({
      studentId: s.id,
      status: attendanceMap[s.id]?.status || 'PRESENT',
      notes: attendanceMap[s.id]?.notes,
    }));

    markBatchStudentAttendance(records, selectedBatch, selectedSport);
  };

  const statusConfigs: Record<
    AttendanceStatus,
    { label: string; icon: React.ReactNode; activeColor: string; inactiveColor: string }
  > = {
    PRESENT: {
      label: 'Present',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      activeColor: 'bg-emerald-600 text-white shadow-sm',
      inactiveColor: 'hover:bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    LATE: {
      label: 'Late',
      icon: <Clock className="w-3.5 h-3.5" />,
      activeColor: 'bg-amber-600 text-white shadow-sm',
      inactiveColor: 'hover:bg-amber-50 text-amber-800 border-amber-200',
    },
    ABSENT: {
      label: 'Absent',
      icon: <XCircle className="w-3.5 h-3.5" />,
      activeColor: 'bg-rose-600 text-white shadow-sm',
      inactiveColor: 'hover:bg-rose-50 text-rose-800 border-rose-200',
    },
    MEDICAL_LEAVE: {
      label: 'Medical',
      icon: <Heart className="w-3.5 h-3.5" />,
      activeColor: 'bg-purple-600 text-white shadow-sm',
      inactiveColor: 'hover:bg-purple-50 text-purple-800 border-purple-200',
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Session Roster & Student Attendance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant 1-tap batch attendance verification with medical absence tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark All Present</span>
          </button>
          <button
            onClick={handleSaveAttendance}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Submit Session Attendance</span>
          </button>
        </div>
      </div>

      {/* Batch & Sport Selector */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Batch / Shift</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
          >
            <option value="Morning 06:00 - 08:00 Squad">Morning 06:00 - 08:00 Squad</option>
            <option value="Evening Elite 16:30 - 18:30">Evening Elite 16:30 - 18:30</option>
            <option value="Weekend Junior Clinic 09:00 - 11:00">Weekend Junior Clinic 09:00 - 11:00</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <label className="text-[11px] font-bold text-slate-600 block mb-1">Sport Discipline</label>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
          >
            <option value="Tennis">Tennis</option>
            <option value="Football">Football</option>
            <option value="Badminton">Badminton</option>
            <option value="Swimming">Swimming</option>
            <option value="Athletics">Athletics</option>
          </select>
        </div>

        <div className="flex items-end">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{batchStudents.length} Athletes in Session</span>
          </div>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="space-y-3">
        {batchStudents.map((student) => {
          const currentStatus = attendanceMap[student.id]?.status || 'PRESENT';
          const currentNotes = attendanceMap[student.id]?.notes || '';

          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Student info */}
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={student.photoUrl}
                  alt={student.firstName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="font-mono text-[10px] text-indigo-600 font-semibold px-1.5 py-0.2 rounded bg-indigo-50">
                      {student.studentCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Parent: {student.parentName} ({student.parentPhone})
                  </div>
                  {student.medicalNotes && (
                    <div className="text-[10px] text-rose-700 font-medium truncate max-w-sm">
                      ⚠️ Medical: {student.medicalNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Selector Pills & Notes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                {/* 4 Status Buttons (2x2 on phone, row on tablet/desktop) */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                  {(['PRESENT', 'LATE', 'ABSENT', 'MEDICAL_LEAVE'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(student.id, st)}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border min-h-[40px] ${
                        currentStatus === st
                          ? statusConfigs[st].activeColor
                          : `border-transparent text-slate-600 ${statusConfigs[st].inactiveColor}`
                      }`}
                    >
                      {statusConfigs[st].icon}
                      <span>{statusConfigs[st].label}</span>
                    </button>
                  ))}
                </div>

                {/* Quick note input */}
                <input
                  type="text"
                  value={currentNotes}
                  onChange={(e) => handleNotesChange(student.id, e.target.value)}
                  placeholder="Add session note (e.g. knee ice applied)..."
                  className="w-full sm:w-56 p-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
