import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { BulkIngestRow, IngestValidationIssue } from '../../types';
import { SecurityGateNotice } from '../common/SecurityGateNotice';

const SAMPLE_PAYLOAD = `[
  {
    "full_name": "Marcus Vance",
    "dob": "2012-05-14",
    "blood_group": "O+",
    "medical_notes": "Mild exercise-induced asthma",
    "parent_name": "Sarah Vance",
    "parent_phone": "+19876543210",
    "parent_email": "sarah.vance@example.com",
    "enrolled_sports": ["Tennis", "Swimming"],
    "date_of_joining": "2024-01-10",
    "achievements": [
      {
        "title": "Regional U-12 Runner Up",
        "sport": "Tennis",
        "year": 2024
      }
    ]
  },
  {
    "full_name": "Zara Takahashi",
    "dob": "2013-09-21",
    "blood_group": "A+",
    "medical_notes": "No known allergies",
    "parent_name": "Kenji Takahashi",
    "parent_phone": "+15554329871",
    "parent_email": "kenji.t@example.com",
    "enrolled_sports": ["Badminton", "Athletics"],
    "date_of_joining": "2024-04-12",
    "achievements": [
      {
        "title": "Youth Sprint Champion",
        "sport": "Athletics",
        "year": 2025
      }
    ]
  },
  {
    "full_name": "Liam O'Connor",
    "dob": "2014-03-30",
    "blood_group": "B+",
    "medical_notes": "Carries allergy inhaler",
    "parent_name": "Claire O'Connor",
    "parent_phone": "+15558901234",
    "parent_email": "claire.oc@example.com",
    "enrolled_sports": ["Football"],
    "date_of_joining": "2025-02-01"
  },
  {
    "full_name": "Test Incomplete Athlete",
    "dob": "invalid-date",
    "blood_group": "Z_POSITIVE",
    "medical_notes": "",
    "parent_name": "Unknown",
    "parent_phone": "",
    "enrolled_sports": []
  }
]`;

export const BulkIngestionEngine: React.FC = () => {
  const { currentRole, validateBulkIngestionData, executeBulkIngest } = useApp();

  const [rawText, setRawText] = useState(SAMPLE_PAYLOAD);
  const [activeFormat, setActiveFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [dryRunResults, setDryRunResults] = useState<{
    validCount: number;
    errorCount: number;
    issues: IngestValidationIssue[];
    validRows: BulkIngestRow[];
  } | null>(null);
  const [isCommitted, setIsCommitted] = useState(false);

  // RBAC Guard
  if (currentRole !== 'ADMIN') {
    return (
      <SecurityGateNotice
        moduleName="Bulk Data Ingestion Engine"
        requiredRole="ADMIN"
        reason="Direct database ingestion and schema migration tools are exclusively reserved for System Administrators. Bulk operations bypass standard front-desk intake forms and require elevated data authority."
      />
    );
  }

  // Parse CSV to JSON rows
  const parseCSV = (csvText: string): BulkIngestRow[] => {
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows: BulkIngestRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        if (h === 'enrolled_sports') {
          obj[h] = values[idx] ? values[idx].split(';').map((s) => s.trim()) : [];
        } else {
          obj[h] = values[idx];
        }
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      if (file.name.endsWith('.csv')) {
        setActiveFormat('CSV');
      } else {
        setActiveFormat('JSON');
      }
      setDryRunResults(null);
      setIsCommitted(false);
    };
    reader.readAsText(file);
  };

  const runValidation = () => {
    let rows: BulkIngestRow[] = [];
    try {
      if (activeFormat === 'JSON') {
        rows = JSON.parse(rawText);
      } else {
        rows = parseCSV(rawText);
      }
    } catch (err: any) {
      alert(`Syntax Error parsing ${activeFormat}: ${err.message}`);
      return;
    }

    const results = validateBulkIngestionData(rows);
    setDryRunResults(results);
    setIsCommitted(false);
  };

  const handleExecuteCommit = () => {
    if (!dryRunResults || dryRunResults.validRows.length === 0) return;
    executeBulkIngest(dryRunResults.validRows);
    setIsCommitted(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
              <Lock className="w-3.5 h-3.5" /> Admin-Exclusive Data Pipeline
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Bulk Data Ingestion Engine
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Batch-ingest legacy student cohorts and seasonal rosters via JSON or CSV. Pre-validates medical records, WhatsApp guardian contacts, and schema integrity with atomic dry-runs.
            </p>
          </div>

          <button
            onClick={() => {
              setRawText(SAMPLE_PAYLOAD);
              setActiveFormat('JSON');
              setDryRunResults(null);
              setIsCommitted(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-sm shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Sample Payload</span>
          </button>
        </div>
      </div>

      {/* Format & File Upload Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Editor & Upload */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Format:</span>
                <button
                  onClick={() => setActiveFormat('JSON')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFormat === 'JSON'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>JSON Payload</span>
                </button>
                <button
                  onClick={() => setActiveFormat('CSV')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFormat === 'CSV'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV Spreadsheet</span>
                </button>
              </div>

              {/* Upload file trigger */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer transition-colors">
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload .json or .csv</span>
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Code / Text Area */}
            <div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
                <span>Payload Content ({activeFormat}):</span>
                <span className="font-mono text-[10px]">Schema checked against DDL active_students</span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setDryRunResults(null);
                  setIsCommitted(false);
                }}
                className="w-full h-80 font-mono text-xs p-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-900 text-slate-100"
                placeholder={
                  activeFormat === 'JSON'
                    ? '[{ "full_name": "...", "dob": "...", ... }]'
                    : 'full_name,dob,blood_group,parent_phone,enrolled_sports\nMarcus Vance,2012-05-14,O+,+19876543210,Tennis;Swimming'
                }
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setRawText('');
                  setDryRunResults(null);
                }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Editor</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={runValidation}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>Run Dry-Run Validation</span>
                </button>

                {dryRunResults && dryRunResults.validCount > 0 && !isCommitted && (
                  <button
                    onClick={handleExecuteCommit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm animate-pulse"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Commit {dryRunResults.validCount} Valid Records</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Dry-Run Diagnostics & Inspection */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Pipeline Diagnostic Report</h3>

            {!dryRunResults ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <p>Click &ldquo;Run Dry-Run Validation&rdquo; to test the ingestion stream against schema constraints and duplicate checks.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                {/* Scorecards */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[11px] font-bold text-emerald-800 uppercase">Valid Rows</div>
                    <div className="text-2xl font-black text-emerald-700 mt-0.5">
                      {dryRunResults.validCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="text-[11px] font-bold text-rose-800 uppercase">Failed Rows</div>
                    <div className="text-2xl font-black text-rose-700 mt-0.5">
                      {dryRunResults.errorCount}
                    </div>
                  </div>
                </div>

                {isCommitted && (
                  <div className="p-3.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Batch inserted into Active Directory. New student codes assigned (`VEN-2026-XXX`).</span>
                  </div>
                )}

                {/* Issues Log */}
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                    <span>Validation Diagnostics:</span>
                    <span className="text-[10px] text-slate-400">{dryRunResults.issues.length} Issues Flagged</span>
                  </div>

                  {dryRunResults.issues.length === 0 ? (
                    <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>100% Schema Compliance. All rows passed validation.</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {dryRunResults.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl text-xs border ${
                            issue.severity === 'error'
                              ? 'bg-rose-50 border-rose-200 text-rose-950'
                              : 'bg-amber-50 border-amber-200 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="flex items-center gap-1">
                              {issue.severity === 'error' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              )}
                              Row {issue.row}: Field &lsquo;{issue.field}&rsquo;
                            </span>
                            <span className="uppercase text-[9px] px-1.5 py-0.5 rounded font-mono bg-white/70">
                              {issue.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-tight opacity-90">{issue.message}</p>
                          {issue.valueProvided && (
                            <div className="mt-1 text-[10px] font-mono text-slate-500 truncate">
                              Provided: &quot;{issue.valueProvided}&quot;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
