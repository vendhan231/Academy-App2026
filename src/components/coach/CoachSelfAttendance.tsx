import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  AlertCircle,
  Play,
  Square,
  ShieldCheck,
} from 'lucide-react';

export const CoachSelfAttendance: React.FC = () => {
  const {
    currentUser,
    coaches,
    coachAttendance,
    recordCoachCheckIn,
    recordCoachCheckOut,
  } = useApp();

  const currentCoach = coaches.find((c) => c.userId === currentUser.id) || coaches[0];
  const [sessionType, setSessionType] = useState<'Batch Training' | 'Private Coaching' | 'Clinic'>('Batch Training');
  const [simulatedDistance, setSimulatedDistance] = useState(38);

  const isCheckedIn = currentCoach?.isCheckedInToday;

  const handleCheckIn = () => {
    recordCoachCheckIn(currentCoach.id, sessionType);
  };

  const handleCheckOut = () => {
    recordCoachCheckOut(currentCoach.id);
  };

  const myHistory = coachAttendance.filter((a) => a.coachId === currentCoach?.id);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Coach Geofenced Shift Verification
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic GPS radius validation for payroll attendance verification and payslip calculation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Payroll Engine Synced</span>
          </span>
        </div>
      </div>

      {/* Main Check-In Console */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Radar & Action */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentCoach?.avatar}
                alt={currentCoach?.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400"
              />
              <div>
                <h3 className="font-extrabold text-white text-base">{currentCoach?.name}</h3>
                <p className="text-xs text-slate-300">{currentCoach?.certification}</p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isCheckedIn
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span>{isCheckedIn ? 'Currently on Shift' : 'Off Duty'}</span>
              </span>
              {currentCoach?.lastCheckInTime && (
                <div className="text-[10px] text-slate-400 mt-1">
                  Last In: {currentCoach.lastCheckInTime}
                </div>
              )}
            </div>
          </div>

          {/* GPS Radar Simulation Card */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vendhan Center Court GPS Radar</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  37.7749° N, 122.4194° W • Distance: {simulatedDistance}m
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full">
                ✓ Within 200m Perimeter
              </span>
            </div>
          </div>

          {/* Shift Selection & Controls */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Session Type to Log for Payroll
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Batch Training', 'Private Coaching', 'Clinic'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSessionType(type)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      sessionType === type
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {!isCheckedIn ? (
                <button
                  onClick={handleCheckIn}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Geofence Clock In ({sessionType})</span>
                </button>
              ) : (
                <button
                  onClick={handleCheckOut}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Clock Out & Complete Shift</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Verified Metrics */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Monthly Compensation Pulse</h3>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
              Verified Sessions
            </span>
            <div className="text-3xl font-black text-indigo-950">
              {currentCoach?.verifiedSessionsThisMonth}
            </div>
            <div className="text-[10px] text-indigo-700 font-semibold">
              Multiplier: ${currentCoach?.perSessionRate} / session
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Current Session Earnings
            </span>
            <div className="text-3xl font-black text-emerald-950">
              ${(currentCoach?.verifiedSessionsThisMonth || 0) * (currentCoach?.perSessionRate || 65)}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold">
              + Base Salary ${currentCoach?.baseSalary}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Direct Payroll Integration</span>
            </div>
            <p className="text-[11px]">
              Every clock-in instantly updates the Admin Payroll Engine ledger without paperwork.
            </p>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm">Coach Shift Audit Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Shift Type</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">GPS Geofence Status</th>
                <th className="py-3 px-4">Payroll Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myHistory.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{rec.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{rec.sessionType}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{rec.checkInTime}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{rec.checkOutTime || 'Active'}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified ({rec.distanceFromAcademyMeters}m)</span>
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-indigo-600 text-[11px]">Credited to Payroll</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
