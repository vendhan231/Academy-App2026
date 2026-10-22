import { NextRequest, NextResponse } from 'next/server';
import { ApiError, requireRole, withApiErrorHandling } from '@/lib/apiAuth';
import { SportId, isSportId } from '@/lib/sports';
import { createStudent, getStore, persistStore, persistUsers, visibleStudents } from '@/server/store';
import { ActiveStudent, BloodGroup } from '@/types';
import { isIsoDate } from '@/server/validation';

/**
 * The student directory.
 *
 * A coach sees only the students enrolled in their sports, an admin sees the
 * whole directory, and a student is rejected outright. Creating a student is
 * an admin only operation.
 */

export async function GET(req: NextRequest) {
  return withApiErrorHandling(async () => {
    const session = await requireRole(req, ['ADMIN', 'COACH']);
    const students = visibleStudents(session);
    const safeStudents = students.map(({ password: _password, ...student }) => student);
    return NextResponse.json({ success: true, students: safeStudents, count: safeStudents.length });
  });
}

export async function POST(req: NextRequest) {
  return withApiErrorHandling(async () => {
    await requireRole(req, ['ADMIN']);

    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, 'A JSON body is required.');

    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();

    if (!firstName || !lastName) {
      throw new ApiError(400, 'A first and last name are required.');
    }
    if (firstName.length > 80 || lastName.length > 80) {
      throw new ApiError(400, 'Student names must be 80 characters or fewer.');
    }

    const parentPhone = String(body.parentPhone ?? '').trim();
    if (!/^\+[1-9]\d{7,14}$/.test(parentPhone)) {
      throw new ApiError(400, 'Guardian phone must use international E.164 format (for example, +15550192831).');
    }
    if (body.dob !== undefined && !isIsoDate(body.dob)) {
      throw new ApiError(400, 'Date of birth must use a valid YYYY-MM-DD date.');
    }
    if (body.gender !== undefined && !['Male', 'Female', 'Other'].includes(body.gender)) {
      throw new ApiError(400, 'Choose a valid gender value.');
    }
    const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (body.bloodGroup !== undefined && !bloodGroups.includes(body.bloodGroup)) {
      throw new ApiError(400, 'Choose a valid blood group.');
    }
    if (body.parentEmail !== undefined && body.parentEmail !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.parentEmail)) {
      throw new ApiError(400, 'Enter a valid guardian email address.');
    }

    const rawSports = Array.isArray(body.sportIds) ? body.sportIds : [];
    const sportIds = rawSports.filter((sportId: unknown): sportId is SportId => isSportId(sportId));

    if (sportIds.length === 0) {
      throw new ApiError(400, 'Pick at least one sport for the new student.');
    }

    if (rawSports.length !== sportIds.length) {
      throw new ApiError(400, 'One of the selected sports is not offered by the academy.');
    }

    const store = getStore();
    const { student, credentials } = createStudent(
      {
        firstName,
        lastName,
        dob: body.dob,
        gender: body.gender as ActiveStudent['gender'] | undefined,
        bloodGroup: body.bloodGroup as BloodGroup | undefined,
        medicalNotes: body.medicalNotes,
        parentName: body.parentName,
        parentPhone,
        parentEmail: body.parentEmail,
        batchShift: body.batchShift,
        dateOfJoining: body.dateOfJoining,
      },
      sportIds
    );
    await persistStore();
    await persistUsers();
    return NextResponse.json(
      {
        success: true,
        message: `${student.firstName} was registered as ${student.studentCode}.`,
        student: { ...student, password: undefined },
        credentials,
      },
      { status: 201 }
    );
  });
}
