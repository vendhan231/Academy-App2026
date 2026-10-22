import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Banknote,
  CheckCircle2,
  Clock,
  MapPin,
  FileCheck2,
  DollarSign,
  ChevronRight,
  X,
  Printer,
} from 'lucide-react';
import { CoachPayrollRecord } from '../../types';

export const CoachPayrollEngine: React.FC = () => {
  const { payroll, coaches, markPayrollDisbursed, coachAttendance } = useApp();
  const [selectedPayslip, setSelectedPayslip] = useState<CoachPayrollRecord | null>(null);

  const totalPayrollLiability = payroll.reduce((acc, curr) => acc + curr.totalDisbursed, 0);
  const totalVerifiedSessions = payroll.reduce((acc, curr) => acc + curr.verifiedSessions, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Coach Payroll & Compensation Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time salary calculation = Base Salary + (Per Session Rate × Verified Geofenced Sessions).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
            Period: October 2026
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-600">Total Month Payroll</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">${totalPayrollLiability.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Base salaries + verified session bonuses</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-blue-700">Verified Sessions</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">{totalVerifiedSessions} Sessions</div>
          <div className="text-[10px] text-blue-600 mt-0.5">100% verified via GPS geofence radar</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-emerald-700">Active Staff Coaches</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{coaches.length} Coaches</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Direct deposit & automated payslips</div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Monthly Compensation Summary</h3>
          <span className="text-[11px] font-mono text-slate-400">Formula: Base + (Sessions × Rate) + Bonus</span>
        </div>

        {/* Mobile Payroll Cards (<md) */}
        <div className="md:hidden p-3 space-y-3">
          {payroll.map((p) => {
            const coach = coaches.find((c) => c.id === p.coachId);
            return (
              <div
                key={p.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={coach?.avatar}
                      alt={p.coachName}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{p.coachName}</div>
                      <div className="text-[10px] text-slate-500">{coach?.certification}</div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'DISBURSED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Base Salary</span>
                    <span className="font-mono font-bold text-slate-800">${p.baseSalary.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">GPS Sessions</span>
                    <span className="text-blue-700 font-bold">{p.verifiedSessions} ({p.perSessionRate}/ea)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Session Total</span>
                    <span className="font-mono font-bold text-slate-800">${p.totalSessionPayout.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Net Compensation</span>
                    <span className="text-sm font-black text-slate-900">${p.totalDisbursed.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedPayslip(p)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-bold text-xs min-h-[40px]"
                  >
                    View Payslip
                  </button>
                  {p.status !== 'DISBURSED' && (
                    <button
                      onClick={() => markPayrollDisbursed(p.id)}
                      className="py-2 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs min-h-[40px] shadow-sm"
                    >
                      Disburse
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Payroll Table (>=md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Staff Coach</th>
                <th className="py-3.5 px-4">Base Salary</th>
                <th className="py-3.5 px-4">Verified Sessions</th>
                <th className="py-3.5 px-4">Per Session Rate</th>
                <th className="py-3.5 px-4">Session Payout</th>
                <th className="py-3.5 px-4">Total Compensation</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payroll.map((p) => {
                const coach = coaches.find((c) => c.id === p.coachId);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={coach?.avatar}
                          alt={p.coachName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{p.coachName}</div>
                          <div className="text-[10px] text-slate-400">{coach?.certification}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      ${p.baseSalary.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>{p.verifiedSessions} Sessions</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      ${p.perSessionRate} / session
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      ${p.totalSessionPayout.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                      ${p.totalDisbursed.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'DISBURSED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPayslip(p)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-[11px]"
                        >
                          View Payslip
                        </button>
                        {p.status !== 'DISBURSED' && (
                          <button
                            onClick={() => markPayrollDisbursed(p.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] shadow-sm"
                          >
                            Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Geofence GPS Shift Verification Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Recent Geofenced Attendance Audit Trail
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Radar Radius: ≤ 200m from Academy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {coachAttendance.slice(0, 4).map((att) => (
            <div
              key={att.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between text-xs"
            >
              <div>
                <div className="font-bold text-slate-900">{att.coachName}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Shift: {att.sessionType} • Check-in: {att.checkInTime}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Geofence GPS match ({att.distanceFromAcademyMeters}m from Center Court)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Monthly Coach Payslip</h3>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Coach:</span>
                <span className="font-bold text-slate-900">{selectedPayslip.coachName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Month:</span>
                <span>{selectedPayslip.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contract Base Salary:</span>
                <span className="font-bold">${selectedPayslip.baseSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verified Sessions Conducted:</span>
                <span>{selectedPayslip.verifiedSessions} × ${selectedPayslip.perSessionRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Payout:</span>
                <span className="font-bold">${selectedPayslip.totalSessionPayout.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Performance Bonuses:</span>
                <span className="font-bold text-emerald-700">+${selectedPayslip.bonuses}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Net Total Disbursed:</span>
                <span className="text-indigo-600">${selectedPayslip.totalDisbursed.toLocaleString()} USD</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                Disbursement Status: {selectedPayslip.status} ({selectedPayslip.disbursementDate || 'Pending clearance'})
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
