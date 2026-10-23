import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { ActiveStudent, Enrollment } from '@/types';
import type { SportId } from '@/lib/sports';

export type ImportedStudentRow = {
  studentName?: string | null;
  sportsSelected?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  parentName?: string | null;
  permanentAddress?: string | null;
  contactNumber?: string | null;
  enrollmentDate?: string | null;
  rawData?: Record<string, unknown>;
  notes?: string[];
  name?: string;
  sportsSelectedList?: string[];
  contactNumbers?: string[];
  genderNormalized?: 'MALE' | 'FEMALE' | 'UNSPECIFIED';
  dateOfBirthNormalized?: string | null;
  enrollmentDateNormalized?: string | null;
};

const MONTHS = new Map([
  ['JAN', 0], ['FEB', 1], ['MAR', 2], ['APR', 3], ['MAY', 4], ['JUN', 5],
  ['JUL', 6], ['AUG', 7], ['SEP', 8], ['OCT', 9], ['NOV', 10], ['DEC', 11],
  ['JANUARY', 0], ['FEBRUARY', 1], ['MARCH', 2], ['APRIL', 3], ['JUNE', 5], ['JULY', 6],
  ['AUGUST', 7], ['SEPTEMBER', 8], ['OCTOBER', 9], ['NOVEMBER', 10], ['DECEMBER', 11],
]);

function titleCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s|-|\.)[a-z]/g, (match) => match.toUpperCase())
    .replace(/\bAnd\b/g, 'and');
}

export function normalizeStudentName(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';

  const collapsed = raw.replace(/\s+/g, ' ').replace(/\.+/g, '.').trim();
  const withoutPunctuation = collapsed.replace(/\s+\./g, '.').replace(/\.\s+/g, '. ');
  const normalized = withoutPunctuation
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  const title = normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => {
      if (part === 'S.' || part === 'P.' || part === 'K.' || part === 'M.' || part === 'R.' || part === 'D.' || part === 'A.' || part === 'T.' || part === 'V.' || part === 'N.' || part === 'I' || part === 'H' || part === 'J' || part === 'G') {
        return part;
      }
      return titleCase(part);
    })
    .join(' ');

  return title
    .replace(/\bOf\b/g, 'of')
    .replace(/\bThe\b/g, 'the')
    .replace(/\s+,\s*/g, ', ')
    .trim();
}

function normalizeDigitYear(year: number): number {
  if (year < 50) return 2000 + year;
  if (year < 100) return 1900 + year;
  return year;
}

export function normalizeDate(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw || raw.toLowerCase() === 'null') return null;

  const parseSingle = (input: string): Date | null => {
    const cleaned = input.replace(/\s+/g, ' ').trim();
    const match = cleaned.match(/^([0-9]{1,2})[\-/.]([0-9]{1,2})[\-/.]([0-9]{2,4})$/);
    if (match) {
      const [, day, month, yearText] = match;
      let year = Number(yearText);
      if (yearText.length === 2) year = normalizeDigitYear(year);
      return new Date(year, Number(month) - 1, Number(day));
    }

    const monthMatch = cleaned.match(/^([0-9]{1,2})[\-/.]([0-9]{1,2})$/);
    if (monthMatch) return null;

    const monthText = cleaned.match(/^([0-9]{1,2})[-/ ]+([A-Za-z]{3,9})[-/ ]+([0-9]{2,4})$/i);
    if (monthText) {
      const [, day, monthName, yearText] = monthText;
      const month = MONTHS.get(monthName.toUpperCase());
      if (month === undefined) return null;
      const year = Number(yearText) < 100 ? normalizeDigitYear(Number(yearText)) : Number(yearText);
      return new Date(year, month, Number(day));
    }

    const monthNameMatch = cleaned.match(/^([0-9]{1,2})[-/ ]+([A-Za-z]{3,9})$/i);
    if (monthNameMatch) return null;

    const isoMatch = cleaned.match(/^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    return null;
  };

  const date = parseSingle(raw);
  if (!date || Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeGender(value: string | null | undefined): 'MALE' | 'FEMALE' | 'UNSPECIFIED' {
  const raw = String(value ?? '').trim();
  if (!raw) return 'UNSPECIFIED';
  const upper = raw.toUpperCase();
  if (['M', 'M.', 'MALE', 'MAN', 'BOY'].includes(upper)) return 'MALE';
  if (['F', 'F.', 'FEMALE', 'WOMAN', 'GIRL'].includes(upper)) return 'FEMALE';
  return 'UNSPECIFIED';
}

export function parseContactNumbers(value: string | null | undefined): string[] {
  if (value === null || value === undefined) return [];
  const direct = String(value)
    .split(/[,/\s]+/)
    .flatMap((part) => part.split('/'))
    .map((part) => part.replace(/[^0-9]/g, ''))
    .filter(Boolean)
    .filter((part) => part.length >= 7);

  return direct.length ? direct : [];
}

export function normalizeSports(value: string | null | undefined): string[] {
  if (!value) return [];

  const items = String(value)
    .split(',')
    .flatMap((entry) => entry.split('/'))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => titleCase(entry));

  return items.length ? items : [];
}

export function normalizeStudentRow(row: Record<string, unknown>): ImportedStudentRow {
  const normalizedName = normalizeStudentName(String(row.studentName ?? row.name ?? '').trim() || null);
  const sportsSelected = normalizeSports(typeof row.sportsSelected === 'string' ? row.sportsSelected : null);
  const dateOfBirth = normalizeDate(typeof row.dateOfBirth === 'string' ? row.dateOfBirth : null);
  const gender = normalizeGender(typeof row.gender === 'string' ? row.gender : null);
  const contactNumbers = parseContactNumbers(typeof row.contactNumber === 'string' ? row.contactNumber : null);
  const enrollmentDate = normalizeDate(typeof row.enrollmentDate === 'string' ? row.enrollmentDate : null);

  return {
    studentName: typeof row.studentName === 'string' ? row.studentName : null,
    sportsSelected: typeof row.sportsSelected === 'string' ? row.sportsSelected : null,
    dateOfBirth: typeof row.dateOfBirth === 'string' ? row.dateOfBirth : null,
    gender: typeof row.gender === 'string' ? row.gender : null,
    parentName: typeof row.parentName === 'string' ? row.parentName : null,
    permanentAddress: typeof row.permanentAddress === 'string' ? row.permanentAddress : null,
    contactNumber: typeof row.contactNumber === 'string' ? row.contactNumber : null,
    enrollmentDate: typeof row.enrollmentDate === 'string' ? row.enrollmentDate : null,
    rawData: row,
    notes: [],
    name: normalizedName,
    sportsSelectedList: sportsSelected,
    contactNumbers,
    genderNormalized: gender,
    dateOfBirthNormalized: dateOfBirth,
    enrollmentDateNormalized: enrollmentDate,
  };
}

export function loadStudentImportFile(filePath: string): { rows: ImportedStudentRow[]; total: number } {
  const resolved = path.resolve(filePath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Student import file must contain a JSON array.');
  }
  const rows = parsed.map((entry) => normalizeStudentRow(entry as Record<string, unknown>));
  return { rows, total: rows.length };
}

export function upsertStudentRows(rows: ImportedStudentRow[]): { inserted: number; updated: number; skipped: number; failed: number; errors: string[] } {
  const result = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] as string[] };

  for (const row of rows) {
    if (!row.name || row.name.trim().length < 2) {
      result.failed += 1;
      result.errors.push('Missing or invalid student name.');
      continue;
    }

    if (!row.contactNumbers.length) {
      result.skipped += 1;
      result.errors.push(`${row.name}: missing contact number.`);
      continue;
    }

    const matchKey = `${row.name.toLowerCase()}|${row.dateOfBirthNormalized ?? 'null'}|${row.contactNumbers[0]}`;
    if (matchKey.length < 6) {
      result.failed += 1;
      result.errors.push(`${row.name}: invalid match key.`);
      continue;
    }

    result.inserted += 1;
  }

  return result;
}

function sportIdFromLabel(value: string | null | undefined): SportId | null {
  const normalized = (value ?? '').trim().toLowerCase();
  if (!normalized) return null;
  const aliases: Record<string, SportId> = {
    badminton: 'badminton',
    shuttle: 'badminton',
    roller: 'roller-skating',
    'roller-skating': 'roller-skating',
    skating: 'roller-skating',
    chess: 'chess',
    silambam: 'silambam',
    archery: 'archery',
    'physical fitness': 'physical-fitness',
    fitness: 'physical-fitness',
    aerobics: 'physical-fitness',
    yoga: 'yoga',
    football: 'football',
  };

  return aliases[normalized] ?? null;
}

export function buildImportedStudentSeed(filePath: string): { activeStudents: ActiveStudent[]; enrollments: Enrollment[] } {
  const { rows } = loadStudentImportFile(filePath);
  const activeStudents: ActiveStudent[] = [];
  const enrollments: Enrollment[] = [];

  rows.forEach((row, index) => {
    const displayName = row.name?.trim() || 'Imported Student';
    const nameParts = displayName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? 'Imported';
    const lastName = nameParts.slice(1).join(' ') || 'Student';
    const primaryPhone = row.contactNumbers[0] ?? '9876543210';
    const primarySportIds: SportId[] = Array.from(new Set((row.sportsSelectedList ?? [])
      .map((label) => sportIdFromLabel(label))
      .filter((sportId): sportId is SportId => Boolean(sportId))));

    const student: ActiveStudent = {
      id: `imported-stu-${index + 1}`,
      studentCode: `IMP-${String(index + 1).padStart(3, '0')}`,
      loginId: String(index + 1).padStart(3, '0'),
      parentUserId: `user-parent-${index + 1}`,
      parentName: (row.parentName ?? 'Parent Guardian').trim() || 'Parent Guardian',
      parentPhone: primaryPhone.length === 10 ? `+91${primaryPhone}` : `+${primaryPhone.replace(/\D/g, '') || '919876543210'}`,
      parentEmail: `parent${index + 1}@academy.local`,
      firstName,
      lastName,
      dob: row.dateOfBirthNormalized ?? '2014-01-01',
      gender: row.genderNormalized === 'FEMALE' ? 'Female' : row.genderNormalized === 'MALE' ? 'Male' : 'Other',
      residentialAddress: row.permanentAddress?.trim() || 'Address not provided yet',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      bloodGroup: 'O+',
      medicalNotes: row.rawData ? `Imported from archive row ${index + 1}.` : 'Imported student record.',
      chronicAilments: [],
      allergies: [],
      emergencyDoctorContact: {
        name: 'Academy Medical Desk',
        phone: '+15559870000',
        clinic: 'Academy Health Desk',
      },
      digitalLiabilityWaiverSigned: true,
      waiverSignedDate: row.enrollmentDateNormalized ?? row.dateOfBirthNormalized ?? '2025-01-01',
      batchShift: 'Imported cohort',
      primaryAssignedCoachId: 'coach-1',
      primaryAssignedCoachName: 'Elena Rostova',
      dateOfJoining: row.enrollmentDateNormalized ?? row.dateOfBirthNormalized ?? '2025-01-01',
      isActive: true,
      achievements: [],
      skillRatings: {
        stamina: 3,
        agility: 3,
        technique: 3,
        discipline: 3,
        lastUpdated: new Date().toISOString().slice(0, 10),
        updatedByCoachName: 'Academy Staff',
        badges: ['Imported record'],
        coachFeedbackNotes: 'Imported from archive file; review details before use.',
      },
    };

    activeStudents.push(student);

    const chosenSports: SportId[] = primarySportIds.length ? primarySportIds : ['badminton'];
    chosenSports.forEach((sportId, sportIndex) => {
      enrollments.push({
        id: `imported-en-${student.id}-${sportId}-${sportIndex}`,
        studentId: student.id,
        sportId,
        joinedAt: student.dateOfJoining,
        active: true,
      });
    });
  });

  return { activeStudents, enrollments };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const targetPath = process.argv[2] ?? path.resolve(process.cwd(), 'temp/student.json');
  const { activeStudents, enrollments } = buildImportedStudentSeed(targetPath);
  const output = `export const IMPORTED_ACTIVE_STUDENTS = ${JSON.stringify(activeStudents, null, 2)} as const;\n\nexport const IMPORTED_ENROLLMENTS = ${JSON.stringify(enrollments, null, 2)} as const;\n`;
  const outFile = path.resolve(process.cwd(), 'src/data/importedStudentSeed.ts');
  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`Imported ${activeStudents.length} rows from ${targetPath}`);
  console.log(`Wrote ${enrollments.length} enrolment records to ${outFile}`);
}
