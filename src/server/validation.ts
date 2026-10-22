import { AttendanceStatus } from '@/types';
import { SportId, isSportId } from '@/lib/sports';

/** Shared request validation for the API layer. */

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

export function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === 'present' || value === 'absent';
}

export function isSportIdValue(value: unknown): value is SportId {
  return isSportId(value);
}

export interface ParsedEntry {
  studentId: string;
  status: AttendanceStatus;
}

/** Validates the entry list of an attendance payload. */
export function parseAttendanceEntries(value: unknown): ParsedEntry[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const entries: ParsedEntry[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;
    const studentId = String((raw as { studentId?: unknown }).studentId ?? '').trim();
    const status = (raw as { status?: unknown }).status;
    if (!studentId || !isAttendanceStatus(status)) return null;
    entries.push({ studentId, status });
  }

  return entries;
}
