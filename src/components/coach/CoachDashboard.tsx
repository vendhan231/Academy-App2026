import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UserCheck,
  CheckCircle2,
  Calendar,
  Trophy,
  ShieldAlert,
  Compass,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  Edit,
  Save,
  X,
} from 'lucide-react';

interface CoachDashboardProps {
  onNavigate: (tab: string) => void;
  openEmergencyDrawer: () => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({ onNavigate, openEmergencyDrawer }) => {
  const {
    currentUser,
    coaches,
    activeStudents,
    bookings,
    coachAttendance,
    recordCoachCheckIn,
    recordCoachCheckOut,
  } = useApp();

  const currentCoach = coaches.find((c) => c.userId === currentUser.id) || coaches[0];

  // Edit Coach Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [bio, setBio] = useState(currentCoach?.bio || '');
  const [phone, setPhone] = useState(currentCoach?.phone || '');
  const [cert, setCert] = useState(currentCoach?.certification || '');

  const myStudents = activeStudents.filter((s) => s.primaryAssignedCoachId === currentCoach?.id);
  const isCheckedIn = currentCoach?.isCheckedInToday;

  return (
    <div className="space-y-6">
      {/* Top Banner / Coach Dossier */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={currentCoach?.avatar}
              alt={currentCoach?.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{currentCoach?.name}</h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Staff Coach
                </span>
              </div>
              <p className="text-xs text-amber-300 font-semibold mt-0.5">{currentCoach?.certification}</p>
              <p className="text-xs text-slate-300 max-w-xl mt-1 line-clamp-2">{currentCoach?.bio}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {isCheckedIn ? (
              <button
                onClick={() => recordCoachCheckOut(currentCoach.id)}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>Clock Out (On Shift: {currentCoach?.lastCheckInTime})</span>
              </button>
            ) : (
              <button
                onClick={() => recordCoachCheckIn(currentCoach.id, 'Batch Training')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Geofence Clock In</span>
              </button>
            )}

            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('coach-attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Assigned Athletes</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{myStudents.length} Athletes</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">Ready for Session Check-in</div>
        </div>

        <div
          onClick={() => onNavigate('coach-self-attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Verified Sessions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {currentCoach?.verifiedSessionsThisMonth}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            ${currentCoach?.perSessionRate}/session bonus
          </div>
        </div>

        <div
          onClick={() => onNavigate('coach-skills')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">4-Pillar Skill Cards</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">Active</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Updated for Mother&apos;s View</div>
        </div>

        <div
          onClick={() => onNavigate('coach-incidents')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Safety & Incident Desk</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">Incident Form</div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">WhatsApp Emergency Alerts</div>
        </div>
      </div>

      {/* Action Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Student Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Session Student Attendance</h3>
              <p className="text-[11px] text-slate-500">1-Tap Roster Check-in</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Record Present, Absent, Late, or Medical leaves for morning and evening squads with automatic parent status sync.
          </p>
          <button
            onClick={() => onNavigate('coach-attendance')}
            className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <span>Take Batch Attendance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 2: Skill Progression */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Progression & Badges</h3>
              <p className="text-[11px] text-slate-500">Stamina, Agility, Technique</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Assign performance badges, update star ratings, and write personalized assessment notes for parent portfolios.
          </p>
          <button
            onClick={() => onNavigate('coach-skills')}
            className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <span>Update Student Skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Module 3: Geofence Radar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Geofenced Shift Clock</h3>
              <p className="text-[11px] text-slate-500">GPS Radar Verification</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Verify presence on academy grounds within 200m to credit verified sessions directly to your monthly payroll ledger.
          </p>
          <button
            onClick={() => onNavigate('coach-self-attendance')}
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <span>Shift Radar & Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Edit Coach Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Certifications & Credentials</label>
                <input
                  type="text"
                  value={cert}
                  onChange={(e) => setCert(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bio & Coaching Philosophy</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2 border rounded-xl h-24"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                >
                  Save Profile Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
