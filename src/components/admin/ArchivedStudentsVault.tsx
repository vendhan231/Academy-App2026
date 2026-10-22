import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Download,
  RotateCcw,
  Search,
  Filter,
  FileText,
  Calendar,
  Award,
  ChevronRight,
  X,
} from 'lucide-react';
import { ArchivedStudent } from '../../types';
import { SecurityGateNotice } from '../common/SecurityGateNotice';

export const ArchivedStudentsVault: React.FC = () => {
  const { archivedStudents, restoreArchivedStudent, currentRole, addToast } = useApp();

  const [search, setSearch] = useState('');
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<ArchivedStudent | null>(null);

  // RBAC Guard
  if (currentRole !== 'ADMIN') {
    return (
      <SecurityGateNotice
        moduleName="Student Historical Archives (2024-2026 Cohorts)"
        requiredRole="ADMIN"
        reason="Confidential student historical records and exit audits are strictly restricted to Academy Administrators. Coaches and Parents have zero query visibility into archived student vaults."
      />
    );
  }

  const cohorts = Array.from(new Set(archivedStudents.map((a) => a.cohortYears)));

  const filtered = archivedStudents.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(search.toLowerCase()) ||
      item.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      item.parentDetails.phone.includes(search);
    const matchesCohort = cohortFilter === 'ALL' || item.cohortYears === cohortFilter;
    return matchesSearch && matchesCohort;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vendhan_archived_students_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast({
      type: 'success',
      title: 'Archives Exported as JSON',
      description: `Downloaded ${filtered.length} historical student records.`,
    });
  };

  const handleExportCSV = () => {
    const headers = ['StudentCode', 'FullName', 'Cohort', 'Sports', 'ExitReason', 'ArchivedAt', 'ArchivedBy'];
    const rows = filtered.map((item) => [
      item.studentCode,
      `"${item.fullName}"`,
      item.cohortYears,
      `"${item.enrolledSports.join(', ')}"`,
      item.archivalReason,
      item.archivedAt,
      `"${item.archivedBy}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendhan_archived_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    addToast({
      type: 'success',
      title: 'Archives Exported as CSV',
      description: `Downloaded ${filtered.length} historical records into spreadsheet format.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Admin Exclusive Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
              <Lock className="w-3.5 h-3.5" /> Admin-Exclusive Historical Vault
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Student Archives (2024–2026 Cohorts)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Permanent historical repository storing student audit trails, graduation benchmarks, sports achievements, and exit records. Strictly isolated from active training batch queries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archived students by name, ACAD ID, exit reason..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Cohort:</span>
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Cohorts ({archivedStudents.length})</option>
              {cohorts.map((c) => (
                <option key={c} value={c}>
                  {c} Cohort
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Archived Student Cards (<md) */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No historical records match your query.
          </div>
        ) : (
          filtered.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{record.fullName}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-amber-700 font-bold px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200">
                      {record.studentCode}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Cohort: {record.cohortYears}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    record.archivalReason === 'Graduated'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : record.archivalReason === 'Transferred'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {record.archivalReason}
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {record.enrolledSports.map((sp) => (
                  <span
                    key={sp}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700"
                  >
                    {sp}
                  </span>
                ))}
              </div>

              {record.exitNotes && (
                <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  &ldquo;{record.exitNotes}&rdquo;
                </p>
              )}

              <div className="text-[10px] text-slate-400">
                Archived: {new Date(record.archivedAt).toLocaleDateString()} by {record.archivedBy}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 min-h-[40px]"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Audit Dossier</span>
                </button>
                <button
                  onClick={() => restoreArchivedStudent(record.id)}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 min-h-[40px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Archives Table (>=md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Archived Student</th>
                <th className="py-3.5 px-4">Cohort Years</th>
                <th className="py-3.5 px-4">Sports Enrolled</th>
                <th className="py-3.5 px-4">Exit Reason</th>
                <th className="py-3.5 px-4">Archival Audit Trail</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Name & Code */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{record.fullName}</div>
                      <div className="font-mono text-[10px] text-amber-700 font-semibold">
                        {record.studentCode}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Parent: {record.parentDetails.name} ({record.parentDetails.phone})
                      </div>
                    </div>
                  </td>

                  {/* Cohort */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {record.cohortYears}
                    </span>
                  </td>

                  {/* Sports */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {record.enrolledSports.map((sp) => (
                        <span
                          key={sp}
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Exit Reason */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        record.archivalReason === 'Graduated'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : record.archivalReason === 'Transferred'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {record.archivalReason}
                    </span>
                    {record.exitNotes && (
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 italic max-w-xs">
                        &ldquo;{record.exitNotes}&rdquo;
                      </p>
                    )}
                  </td>

                  {/* Audit Trail */}
                  <td className="py-3.5 px-4">
                    <div className="text-[10px] text-slate-600">
                      <div>Archived: {new Date(record.archivedAt).toLocaleDateString()}</div>
                      <div className="text-slate-400">By: {record.archivedBy}</div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Audit Log</span>
                      </button>
                      <button
                        onClick={() => restoreArchivedStudent(record.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                        title="Restore to Active Training Directory"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Archival Audit Trail</h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-sm text-slate-900">{selectedRecord.fullName}</div>
                <div className="font-mono text-amber-700 font-semibold">{selectedRecord.studentCode}</div>
                <div className="text-slate-500 mt-1">Cohort Tenure: {selectedRecord.cohortYears}</div>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Archival Reason:</span>{' '}
                <span className="font-bold text-slate-900">{selectedRecord.archivalReason}</span>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Exit Assessment Notes:</span>
                <p className="mt-1 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-slate-800 italic">
                  {selectedRecord.exitNotes}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700">Historical Achievements Recorded:</span>
                <div className="mt-1 space-y-1.5">
                  {selectedRecord.achievements.map((ach) => (
                    <div key={ach.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900">{ach.title}</div>
                        <div className="text-[10px] text-slate-500">{ach.sport} • {ach.awardedDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t text-[11px] text-slate-500 space-y-1">
                <div>Archived By: <strong className="text-slate-700">{selectedRecord.archivedBy}</strong></div>
                <div>Archived Timestamp: <span className="font-mono">{selectedRecord.archivedAt}</span></div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                onClick={() => {
                  restoreArchivedStudent(selectedRecord.id);
                  setSelectedRecord(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore to Active</span>
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
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
