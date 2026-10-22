import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  HeartPulse,
  Send,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import { IncidentReport } from '../../types';

export const IncidentReportingModule: React.FC = () => {
  const { activeStudents, createIncidentReport, incidents, currentUser } = useApp();

  const [studentId, setStudentId] = useState(activeStudents[0]?.id || '');
  const [sport, setSport] = useState('Tennis');
  const [severity, setSeverity] = useState<IncidentReport['severity']>('LOW');
  const [bodyPart, setBodyPart] = useState('Right Ankle');
  const [description, setDescription] = useState('');
  const [treatment, setTreatment] = useState('Immediate rest, cryotherapy wrap applied for 15 minutes.');
  const [followUp, setFollowUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = activeStudents.find((s) => s.id === studentId);
    if (!student) return;

    createIncidentReport({
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      sport,
      severity,
      bodyPart,
      description,
      treatmentGiven: treatment,
      reportedByCoachName: currentUser.name,
      followUpRequired: followUp,
    });

    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Athlete Safety & Incident Logging Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time injury reporting with automated WhatsApp guardian notifications and medical record tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Instant Guardian WhatsApp Dispatch</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Injury Reporting Form */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Log New Injury / Incident</h3>
              <p className="text-[11px] text-slate-500">Automated WhatsApp Parent Ping</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Student Athlete</label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
              >
                {activeStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.studentCode} • Blood {s.bloodGroup})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Discipline</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                >
                  <option value="Tennis">Tennis</option>
                  <option value="Football">Football</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Badminton">Badminton</option>
                  <option value="Athletics">Athletics</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-rose-700 focus:outline-none"
                >
                  <option value="LOW">LOW (Mild scrape/tweak)</option>
                  <option value="MEDIUM">MEDIUM (Sprain/strain)</option>
                  <option value="HIGH">HIGH (Severe contact)</option>
                  <option value="CRITICAL">CRITICAL (Medical referral)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Affected Body Part</label>
              <input
                type="text"
                required
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                placeholder="e.g. Right Knee, Left Hamstring"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Incident Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details of what occurred (e.g. awkward landing following jump serve)..."
                className="w-full p-2.5 rounded-xl border border-slate-200 h-20 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">First Aid / Treatment Given</label>
              <input
                type="text"
                required
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                id="followup"
                checked={followUp}
                onChange={(e) => setFollowUp(e.target.checked)}
                className="rounded text-rose-600"
              />
              <label htmlFor="followup" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Medical Clearance Required Before Next Session
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Log Incident & Notify Parent via WhatsApp</span>
            </button>
          </form>
        </div>

        {/* Right: History & Logs */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm">Historical Incident Log</h3>
            <span className="text-[11px] text-slate-400 font-mono">{incidents.length} Records Documented</span>
          </div>

          <div className="space-y-3">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">{inc.studentName}</span>
                    <span className="text-[11px] font-semibold text-slate-500">({inc.sport})</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      inc.severity === 'LOW'
                        ? 'bg-amber-100 text-amber-800'
                        : inc.severity === 'MEDIUM'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inc.severity} Severity
                  </span>
                </div>

                <div className="text-slate-700">
                  <strong className="text-slate-900">Injury:</strong> {inc.bodyPart} — {inc.description}
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px]">
                  <strong className="text-slate-800">First Aid Applied:</strong> {inc.treatmentGiven}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1">
                  <span>Reported by {inc.reportedByCoachName} on {new Date(inc.timestamp).toLocaleString()}</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Parent Dispatch Logged</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
