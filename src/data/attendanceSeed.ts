import { AttendanceRecord } from '../types';
import { SportId } from '../lib/sports';
import {
  INITIAL_COACH_ASSIGNMENTS,
  INITIAL_COACHES,
  INITIAL_ENROLLMENTS,
} from './initialData';

/**
 * Deterministic attendance history.
 *
 * The demo ships with three weeks of already-marked attendance so that history
 * and monthly summaries are meaningful on first load, while "today" stays
 * unmarked so a coach can still mark it live. The generator is a pure
 * function of its inputs, which keeps server and client renders identical.
 */

/** Small, fast, stable string hash (FNV-1a). */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export interface AttendanceSeedInput {
  /** student id -> the sports they are enrolled in. */
  enrollments: Record<string, SportId[]>;
  /** Sport to coach mapping, used to record who marked the sheet. */
  coachBySport: Partial<Record<SportId, string>>;
  /** Last day that should contain a record (usually yesterday). */
  endDate: string;
  /** How many days of history to generate. */
  days: number;
  /** Ids of the coaches/admins that may mark attendance. */
  markerIds: string[];
}

export function buildSeedAttendance(input: AttendanceSeedInput): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];

  for (let offset = input.days; offset >= 1; offset -= 1) {
    const date = addDays(input.endDate, -offset);
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();

    // Academy runs six days a week; Sunday is a rest day.
    if (dayOfWeek === 0) continue;

    for (const [studentId, sports] of Object.entries(input.enrollments)) {
      for (const sportId of sports) {
        const roll = hash(`${studentId}:${sportId}:${date}`) % 100;
        const status = roll < 88 ? 'present' : 'absent';
        const markedBy = input.coachBySport[sportId] ?? input.markerIds[0] ?? 'system';

        records.push({
          id: `att-${date}-${studentId}-${sportId}`,
          date,
          sportId,
          studentId,
          status,
          markedBy,
          markedAt: `${date}T${sportId === 'football' ? '06:05' : '06:30'}:00.000Z`,
        });
      }
    }
  }

  return records;
}

/**
 * Builds the seeded history for the whole academy. Shared by the client
 * (optimistic first paint) and the server store so both agree on the data.
 */
export function buildInitialAttendance(): AttendanceRecord[] {
  const enrollments: Record<string, SportId[]> = {};
  for (const enrollment of INITIAL_ENROLLMENTS) {
    enrollments[enrollment.studentId] = enrollments[enrollment.studentId] ?? [];
    enrollments[enrollment.studentId].push(enrollment.sportId);
  }

  const coachBySport: Partial<Record<SportId, string>> = {};
  for (const assignment of INITIAL_COACH_ASSIGNMENTS) {
    const coach = INITIAL_COACHES.find((c) => c.id === assignment.coachId);
    if (coach) coachBySport[assignment.sportId] = coach.userId;
  }

  const yesterday = toISODate(new Date(Date.now() - 86400000));

  return buildSeedAttendance({
    enrollments,
    coachBySport,
    endDate: yesterday,
    days: 21,
    markerIds: ['attendance-seed'],
  });
}
