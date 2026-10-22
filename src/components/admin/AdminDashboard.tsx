import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Archive,
  DollarSign,
  Calendar,
  AlertTriangle,
  UploadCloud,
  FileCheck2,
  Bell,
  ArrowRight,
  TrendingUp,
  Activity,
  Heart,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  openEmergencyDrawer: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, openEmergencyDrawer }) => {
  const {
    activeStudents,
    archivedStudents,
    invoices,
    payroll,
    bookings,
    incidents,
    broadcasts,
  } = useApp();

  const totalRevenue = invoices.filter((i) => i.status === 'PAID').reduce((acc, c) => acc + c.amount, 0);
  const pendingDues = invoices.filter((i) => i.status !== 'PAID').reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Activity className="w-3.5 h-3.5" /> Academy Operations Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Vendhan Sports Academy Control Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time multi-tenant orchestration: strict RBAC isolation, active vs archived student lifecycle, geofenced coach payroll, court reservations, and WhatsApp Cloud emergency broadcasts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openEmergencyDrawer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              <Bell className="w-4 h-4" />
              <span>Trigger Emergency Alert</span>
            </button>
            <button
              onClick={() => onNavigate('admin-bulk-ingest')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all shadow-sm"
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>Bulk Ingestion Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Students */}
        <div
          onClick={() => onNavigate('admin-students')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Active Athletes</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeStudents.length}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% Liability Waivers Logged</span>
          </div>
        </div>

        {/* Archived Students Vault */}
        <div
          onClick={() => onNavigate('admin-archives')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Archived Vault</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-100 text-amber-800 font-bold">
                Admin Exclusive
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{archivedStudents.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Cohorts 2024–2026 Secured
          </div>
        </div>

        {/* Collected Revenue */}
        <div
          onClick={() => onNavigate('admin-fees')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Collected Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            ${pendingDues.toLocaleString()} pending dues
          </div>
        </div>

        {/* Facility Bookings */}
        <div
          onClick={() => onNavigate('facilities')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-600">Court Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{bookings.length}</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            Across 6 Pro Courts & Fields
          </div>
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Student Lifecycle */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Student Lifecycle Engine</h3>
              <p className="text-[11px] text-slate-500">Active Directory & Admin Vault</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Manage athlete medical profiles, blood group tracking, digital liability waivers, and isolated 2024–2026 historical records.
          </p>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('admin-students')}
              className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <span>Active Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('admin-archives')}
              className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Vault</span>
            </button>
          </div>
        </div>

        {/* Module 2: Financial Operations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Financials & Payroll</h3>
              <p className="text-[11px] text-slate-500">Fees Engine & Geofenced Salaries</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Recurring student billing with WhatsApp payment links alongside verified coach attendance session multipliers.
          </p>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('admin-fees')}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <span>Fee Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('admin-payroll')}
              className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Coach Payroll</span>
            </button>
          </div>
        </div>

        {/* Module 3: Ingestion & WhatsApp Broadcast */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Broadcasts & Data Ingest</h3>
              <p className="text-[11px] text-slate-500">WhatsApp HSM & JSON Pipeline</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Meta-compliant emergency broadcast templates with SMS failover and atomic schema dry-run bulk data import.
          </p>
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={openEmergencyDrawer}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <span>Emergency Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('admin-bulk-ingest')}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Bulk Ingest</span>
            </button>
          </div>
        </div>
      </div>

      {/* Incident & Broadcast Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Broadcasts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-sm">Emergency Broadcast Dispatches</h3>
            </div>
            <button
              onClick={openEmergencyDrawer}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
            >
              Broadcast Center →
            </button>
          </div>

          <div className="space-y-2">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="truncate max-w-xs">{b.templateTitle}</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {b.channel} ({b.deliveredCount} Delivered)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">{b.messageContent}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Sender: {b.senderName}</span>
                  <span>{new Date(b.sentAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Medical Incidents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <h3 className="font-extrabold text-slate-900 text-sm">Safety & Incident Reports</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Immediate Guardian Notification</span>
          </div>

          <div className="space-y-2">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900">
                    {inc.studentName} ({inc.sport})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.severity === 'LOW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inc.severity} Severity
                  </span>
                </div>
                <div className="text-[11px] text-slate-700">
                  <strong className="text-rose-900">Body Part:</strong> {inc.bodyPart} • {inc.description}
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  Treatment: {inc.treatmentGiven}
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-700 pt-1">
                  <span>Reported by {inc.reportedByCoachName}</span>
                  <span className="font-semibold">✓ Guardian WhatsApp Notified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
