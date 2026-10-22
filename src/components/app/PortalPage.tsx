'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive, CalendarDays, Check, CircleDollarSign, Clock3, FileText, LogOut,
  Megaphone, Plus, RefreshCw, ShieldAlert, Trophy, Users, UserRoundCheck, X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiPost, apiPut } from '@/lib/apiClient';
import { SportId, SPORTS } from '@/lib/sports';
import { UserRole } from '@/types';

type PortalTab =
  | 'overview'
  | 'students'
  | 'attendance'
  | 'facilities'
  | 'finance'
  | 'staff'
  | 'communications'
  | 'safety'
  | 'media'
  | 'archives'
  | 'import';

const TAB_LABEL: Record<PortalTab, string> = {
  overview: 'Overview',
  students: 'Students',
  attendance: 'Attendance',
  facilities: 'Facilities',
  finance: 'Fees & payroll',
  staff: 'Coach shifts',
  communications: 'Communications',
  safety: 'Incidents',
  media: 'Media gallery',
  archives: 'Archives',
  import: 'Bulk import',
};

const ROLE_TABS: Record<UserRole, PortalTab[]> = {
  ADMIN: ['overview', 'students', 'attendance', 'facilities', 'finance', 'staff', 'communications', 'safety', 'media', 'archives', 'import'],
  COACH: ['overview', 'students', 'attendance', 'facilities', 'staff', 'safety', 'media'],
  STUDENT: ['overview', 'attendance', 'facilities', 'finance', 'communications', 'media'],
};

function SectionTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">{children}</p>;
}

export function PortalPage({ role }: { role: UserRole }) {
  const app = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<PortalTab>('overview');
  const [selectedSport, setSelectedSport] = useState<SportId>(app.mySports[0] ?? 'badminton');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (app.isReady && (!app.isAuthenticated || app.currentRole !== role)) {
      router.replace(app.isAuthenticated ? '/login' : '/login?reason=required');
    }
  }, [app.isReady, app.isAuthenticated, app.currentRole, role, router]);

  useEffect(() => {
    if (role !== 'ADMIN' && app.mySports.length > 0 && !app.mySports.includes(selectedSport)) {
      setSelectedSport(app.mySports[0]);
    }
  }, [role, app.mySports, selectedSport]);

  const tabs = ROLE_TABS[role];
  const students = app.students;
  const todayRecords = app.attendanceForDate(selectedDate, selectedSport);

  const refresh = async () => {
    setBusy(true);
    try {
      await app.refreshFromServer();
      setNotice('Latest shared data loaded.');
    } finally {
      setBusy(false);
      window.setTimeout(() => setNotice(''), 3500);
    }
  };

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch((error) => {
      console.error('Could not clear the server session cookie:', error);
    });
    app.signOut();
    router.replace('/login');
  };

  if (!app.isReady || !app.isAuthenticated || app.currentRole !== role) {
    return <div className="grid min-h-dvh place-items-center text-sm text-slate-500">Loading secure portal…</div>;
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-amber-400">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-900">Vendhan Sports Academy</p>
            <p className="truncate text-xs text-slate-500">{app.currentUser?.name} · {role}</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:flex">
            <span className={`h-2 w-2 rounded-full ${app.isSyncing ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
            {app.isSyncing ? 'Syncing' : 'Live · 5 sec'}
          </span>
          <button onClick={() => void refresh()} disabled={busy} aria-label="Refresh shared data" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => void signOut()} aria-label="Sign out" className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6" aria-label="Portal sections">
          {tabs.map((key) => (
            <button key={key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${tab === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {TAB_LABEL[key]}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
        {tab === 'overview' && <Overview role={role} />}
        {tab === 'students' && <StudentDirectory role={role} />}
        {tab === 'attendance' && (
          <AttendancePanel role={role} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedSport={selectedSport} setSelectedSport={setSelectedSport} records={todayRecords} />
        )}
        {tab === 'facilities' && <FacilitiesPanel role={role} />}
        {tab === 'finance' && <FinancePanel role={role} />}
        {tab === 'staff' && <StaffPanel role={role} />}
        {tab === 'communications' && <CommunicationsPanel role={role} />}
        {tab === 'safety' && <SafetyPanel role={role} />}
        {tab === 'media' && <MediaPanel role={role} />}
        {tab === 'archives' && <ArchivePanel />}
        {tab === 'import' && <ImportPanel />}
      </main>
    </div>
  );
}

function Overview({ role }: { role: UserRole }) {
  const { students, attendance, invoices, bookings, myStudent, coaches, isSyncing } = useApp();
  const pendingFees = invoices.filter((invoice) => invoice.status !== 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0);
  const cards = [
    { label: role === 'STUDENT' ? 'My profile' : 'Students in view', value: role === 'STUDENT' ? (myStudent ? 1 : 0) : students.length, Icon: Users },
    { label: 'Attendance records', value: attendance.length, Icon: UserRoundCheck },
    { label: 'Upcoming bookings', value: bookings.filter((booking) => booking.status !== 'CANCELLED').length, Icon: CalendarDays },
    { label: role === 'ADMIN' ? 'Outstanding fees' : 'My outstanding fees', value: `$${pendingFees.toLocaleString()}`, Icon: CircleDollarSign },
  ];
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-indigo-950 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Operations portal</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Welcome, {useApp().currentUser?.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
          Shared academy records refresh automatically. Changes are permission-checked and saved on the server.
        </p>
        <p className="mt-3 text-xs text-slate-400">{isSyncing ? 'Loading the latest data…' : `${coaches.length} coach profiles available in your view.`}</p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-500">{label}<Icon className="h-4 w-4 text-slate-400" /></div>
            <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      {role === 'COACH' && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Clock-ins are recorded as unverified until the academy configures location boundaries. Unverified time is not included in payroll.</p>}
      {role === 'STUDENT' && <p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">Online fee payments use Stripe Checkout when configured. Payment status changes only after a verified provider webhook.</p>}
    </div>
  );
}

function StudentDirectory({ role }: { role: UserRole }) {
  const app = useApp();
  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [sportId, setSportId] = useState<SportId>(SPORTS[0].id);
  const [working, setWorking] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState<{ username: string; password: string } | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setWorking(true);
    try {
      const result = await apiPost<{ student: { firstName: string; studentCode: string }; credentials?: { username: string; password: string } }>('/api/students', {
        firstName, lastName, parentPhone, sportIds: [sportId],
      });
      if (!result.ok || !result.data) throw new Error(result.message);
      app.addToast({ type: 'success', title: 'Student registered', description: `${result.data.student.firstName} · ${result.data.student.studentCode}` });
      setIssuedCredentials(result.data.credentials ?? null);
      setFirstName(''); setLastName(''); setParentPhone(''); setAdding(false);
      await app.refreshFromServer();
    } catch (error) {
      app.addToast({ type: 'error', title: 'Student not saved', description: error instanceof Error ? error.message : 'Unexpected error.' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <section>
      <div className="mb-5 flex items-start justify-between gap-3">
        <SectionTitle title={role === 'STUDENT' ? 'My student profile' : 'Student directory'} detail="Role-scoped profiles and active sport enrollments." />
        {role === 'ADMIN' && <button onClick={() => setAdding((value) => !value)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Register</button>}
      </div>
      {issuedCredentials && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">New student login — ID: <strong>{issuedCredentials.username}</strong> · temporary password: <strong>{issuedCredentials.password}</strong>. Save this now; it will not be shown again.</p>}
      {adding && (
        <form onSubmit={submit} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
          <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input required value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} placeholder="Guardian phone" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select value={sportId} onChange={(event) => setSportId(event.target.value as SportId)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {SPORTS.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
          </select>
          <button disabled={working} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{working ? 'Saving…' : 'Create student'}</button>
          <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600">Cancel</button>
        </form>
      )}
      {app.students.length === 0 ? <Empty>No student records are available in this role.</Empty> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Guardian</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Skills</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {app.students.map((student) => {
                const rating = Math.round((student.skillRatings.stamina + student.skillRatings.agility + student.skillRatings.technique + student.skillRatings.discipline) / 4);
                return <tr key={student.id}>
                  <td className="px-4 py-3"><p className="font-bold">{student.firstName} {student.lastName}</p><p className="text-xs text-slate-500">{student.studentCode}</p></td>
                  <td className="px-4 py-3">{student.parentName}<p className="text-xs text-slate-500">{student.parentPhone}</p></td>
                  <td className="px-4 py-3">{student.batchShift}</td>
                  <td className="px-4 py-3">{rating}/5 average</td>
                  <td className="px-4 py-3">
                    {role === 'COACH' && <div className="flex flex-wrap gap-1.5"><button onClick={() => app.updateStudentSkills(student.id, { technique: Math.min(5, student.skillRatings.technique + 1) })} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50">Improve technique</button><button onClick={() => app.awardStudentAchievement(student.id, { title: 'Coach recognition', sport: app.mySports[0] ?? 'badminton', category: 'Milestone', description: 'Recognized by the coaching team.', awardedDate: new Date().toISOString().slice(0, 10), coachName: app.currentUser?.name ?? 'Coach' })} className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-50">Award milestone</button></div>}
                    {role === 'ADMIN' && <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => app.archiveStudent(student.id, 'Transferred')} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50">Archive</button>
                      <button
                        title="Only record this after the guardian has explicitly opted in."
                        onClick={() => {
                          if (student.parentMessagingConsentAt) {
                            app.updateActiveStudent(student.id, { parentMessagingConsentAt: undefined });
                          } else if (window.confirm(`Confirm that ${student.parentName} explicitly opted in to academy messages?`)) {
                            app.updateActiveStudent(student.id, { parentMessagingConsentAt: new Date().toISOString() });
                          }
                        }}
                        className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700"
                      >
                        {student.parentMessagingConsentAt ? 'Revoke opt-in' : 'Record opt-in'}
                      </button>
                      <details className="relative">
                        <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">Sports</summary>
                        <select
                          multiple
                          aria-label={`Sports enrolled for ${student.firstName}`}
                          value={app.enrollments.filter((item) => item.studentId === student.id && item.active).map((item) => item.sportId)}
                          onChange={(event) => app.setEnrollments(student.id, Array.from(event.target.selectedOptions, (option) => option.value as SportId))}
                          className="absolute right-0 z-10 mt-1 min-w-40 rounded-lg border border-slate-300 bg-white p-2 shadow-lg"
                        >
                          {SPORTS.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
                        </select>
                      </details>
                    </div>}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AttendancePanel({ role, selectedDate, setSelectedDate, selectedSport, setSelectedSport, records }: {
  role: UserRole; selectedDate: string; setSelectedDate: (value: string) => void; selectedSport: SportId; setSelectedSport: (value: SportId) => void; records: ReturnType<ReturnType<typeof useApp>['attendanceForDate']>;
}) {
  const app = useApp();
  const sportOptions = role === 'ADMIN' ? SPORTS : SPORTS.filter((sport) => app.mySports.includes(sport.id));
  const students = app.studentsForSport(selectedSport);
  const [pending, setPending] = useState<Record<string, 'present' | 'absent'>>({});
  const canMark = role === 'ADMIN' || role === 'COACH';
  const mark = async () => {
    const entries = students.map((student) => ({
      studentId: student.id,
      status: pending[student.id] ?? records.find((item) => item.studentId === student.id)?.status ?? 'present',
    }));
    const result = await app.markAttendance(selectedDate, selectedSport, entries);
    app.addToast({ type: result.success ? 'success' : 'error', title: result.success ? 'Attendance saved' : 'Attendance not saved', description: result.message });
  };
  return (
    <section>
      <SectionTitle title="Attendance" detail="Attendance changes are written through the authenticated server API." />
      <div className="mb-4 flex flex-wrap gap-2">
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
        <select value={selectedSport} onChange={(event) => setSelectedSport(event.target.value as SportId)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          {sportOptions.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        {canMark && <button onClick={() => void mark()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Save sheet</button>}
      </div>
      {students.length === 0 ? <Empty>No enrolled students are available for this sport.</Empty> : (
        <div className="space-y-2">
          {students.map((student) => {
            const status = pending[student.id] ?? records.find((item) => item.studentId === student.id)?.status;
            return <div key={student.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{student.firstName} {student.lastName}</p><p className="text-xs text-slate-500">{student.studentCode}</p></div>
              <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${status === 'present' ? 'bg-emerald-50 text-emerald-700' : status === 'absent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>{status ?? 'Not marked'}</span>
              {canMark && <div className="flex gap-1"><button onClick={() => setPending((value) => ({ ...value, [student.id]: 'present' }))} aria-label={`Mark ${student.firstName} present`} className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4" /></button><button onClick={() => setPending((value) => ({ ...value, [student.id]: 'absent' }))} aria-label={`Mark ${student.firstName} absent`} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"><X className="h-4 w-4" /></button></div>}
            </div>;
          })}
        </div>
      )}
    </section>
  );
}

function FacilitiesPanel({ role }: { role: UserRole }) {
  const app = useApp();
  const [facilityId, setFacilityId] = useState(app.facilities[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const facility = app.facilities.find((item) => item.id === facilityId);
  const book = () => {
    if (!facility || !app.currentUser || !app.currentRole) return;
    const result = app.createBooking({
      facilityId: facility.id, facilityName: facility.name, sport: facility.sport,
      bookedByUserId: app.currentUser.id, bookedByName: app.currentUser.name, bookedByRole: app.currentRole,
      date, startTime, endTime, notes: '',
    });
    app.addToast({ type: result.success ? 'success' : 'error', title: result.success ? 'Booking saved' : 'Booking not saved', description: result.message });
  };
  return (
    <section>
      <SectionTitle title="Facility bookings" detail="Overlapping reservations are rejected by the server." />
      <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <select value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{app.facilities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="flex gap-2"><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm" /><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm" /></div>
        <button onClick={book} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white">Reserve slot</button>
      </div>
      <div className="space-y-2">{app.bookings.length === 0 ? <Empty>No bookings are visible.</Empty> : app.bookings.map((booking) => (
        <div key={booking.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <CalendarDays className="h-5 w-5 text-slate-400" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{booking.facilityName}</p><p className="text-xs text-slate-500">{booking.date} · {booking.startTime}–{booking.endTime} · {booking.bookedByName}</p></div><span className="text-xs font-bold text-slate-600">{booking.status}</span>
          {booking.status !== 'CANCELLED' && (role === 'ADMIN' || booking.bookedByUserId === app.currentUser?.id) && <button onClick={() => app.cancelBooking(booking.id)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700">Cancel</button>}
        </div>
      ))}</div>
    </section>
  );
}

function FinancePanel({ role }: { role: UserRole }) {
  const app = useApp();
  const [invoiceStudent, setInvoiceStudent] = useState(app.students[0]?.id ?? '');
  const [amount, setAmount] = useState('150');
  const [period, setPeriod] = useState(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  const generate = () => {
    const student = app.students.find((item) => item.id === invoiceStudent);
    if (!student || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return;
    app.generateNewInvoice({
      studentId: student.id, studentName: `${student.firstName} ${student.lastName}`,
      parentName: student.parentName, parentPhone: student.parentPhone, amount: Number(amount),
      period, sportsIncluded: app.enrollments.filter((entry) => entry.studentId === student.id && entry.active).map((entry) => entry.sportId),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), status: 'PENDING',
    });
  };
  const visibleInvoices = role === 'STUDENT' && app.myStudent ? app.invoices.filter((invoice) => invoice.studentId === app.myStudent?.id) : app.invoices;
  return (
    <section>
      <SectionTitle title={role === 'ADMIN' ? 'Fees & coach payroll' : 'My fees'} detail="Only verified Stripe webhooks mark invoices as paid." />
      {role === 'ADMIN' && <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4"><select value={invoiceStudent} onChange={(event) => setInvoiceStudent(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{app.students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}</select><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="Amount" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="Billing period" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button onClick={generate} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white">Create invoice</button></div>}
      {visibleInvoices.length === 0 ? <Empty>No invoices are visible.</Empty> : <div className="space-y-2">{visibleInvoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><FileText className="h-5 w-5 text-slate-400" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{invoice.invoiceNumber} · {invoice.studentName}</p><p className="text-xs text-slate-500">{invoice.period} · Due {invoice.dueDate} · ${invoice.amount.toLocaleString()}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{invoice.status}</span>{invoice.status !== 'PAID' && role === 'STUDENT' && <button onClick={() => void app.payInvoice(invoice.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Pay online</button>}{invoice.status !== 'PAID' && role === 'ADMIN' && <button onClick={() => void app.sendWhatsAppPaymentReminder(invoice.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Send reminder</button>}</div>)}</div>}
      {role === 'ADMIN' && <div className="mt-8"><SectionTitle title="Payroll" detail="Coach check-ins are excluded until location verification is configured." />{app.payroll.map((item) => <div key={item.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex-1"><p className="text-sm font-bold">{item.coachName} · {item.month}</p><p className="text-xs text-slate-500">{item.verifiedSessions} verified sessions · ${item.totalDisbursed.toLocaleString()}</p></div><span className="text-xs font-bold">{item.status}</span>{item.status === 'PENDING' && <button onClick={() => app.markPayrollDisbursed(item.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Mark disbursed</button>}</div>)}</div>}
    </section>
  );
}

function StaffPanel({ role }: { role: UserRole }) {
  const app = useApp();
  const coach = app.myCoach;
  const [newCoachName, setNewCoachName] = useState('');
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [newCoachPhone, setNewCoachPhone] = useState('');
  const [newCoachCertification, setNewCoachCertification] = useState('');
  const [newCoachSportIds, setNewCoachSportIds] = useState<SportId[]>([]);
  const [newCoachCredentials, setNewCoachCredentials] = useState<{ username: string; password: string } | null>(null);
  const [creatingCoach, setCreatingCoach] = useState(false);
  const [bio, setBio] = useState(coach?.bio ?? '');
  const [phone, setPhone] = useState(coach?.phone ?? '');
  const [certification, setCertification] = useState(coach?.certification ?? '');
  useEffect(() => {
    if (!coach) return;
    setBio(coach.bio);
    setPhone(coach.phone);
    setCertification(coach.certification);
  }, [coach?.id, coach?.bio, coach?.phone, coach?.certification]);
  const createCoachAccount = async (event: FormEvent) => {
    event.preventDefault();
    setCreatingCoach(true);
    try {
      const result = await apiPost<{ credentials: { username: string; password: string } }>('/api/coaches', {
        name: newCoachName,
        email: newCoachEmail,
        phone: newCoachPhone,
        certification: newCoachCertification,
        sportIds: newCoachSportIds,
      });
      if (!result.ok || !result.data) throw new Error(result.message);
      setNewCoachCredentials(result.data.credentials);
      setNewCoachName(''); setNewCoachEmail(''); setNewCoachPhone(''); setNewCoachCertification('');
      setNewCoachSportIds([]);
      await app.refreshFromServer();
      app.addToast({ type: 'success', title: 'Coach account created', description: 'Save the one-time login credentials shown below.' });
    } catch (error) {
      app.addToast({ type: 'error', title: 'Coach not created', description: error instanceof Error ? error.message : 'Unexpected error.' });
    } finally {
      setCreatingCoach(false);
    }
  };
  return (
    <section>
      <SectionTitle title={role === 'ADMIN' ? 'Coach shifts' : 'My shift'} detail="Location is not verified in this deployment; shift entries remain outside payroll." />
      {role === 'COACH' && coach && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><div className="flex-1"><p className="font-bold">{coach.name}</p><p className="text-xs text-slate-500">{coach.isCheckedInToday ? `Checked in at ${coach.lastCheckInTime ?? 'today'}` : 'Not checked in'}</p></div>{coach.isCheckedInToday ? <button onClick={() => app.recordCoachCheckOut(coach.id)} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-bold text-white">Check out</button> : <button onClick={() => app.recordCoachCheckIn(coach.id, 'Batch Training')} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white">Record check-in</button>}</div>}
      {role === 'COACH' && coach && <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><h3 className="text-sm font-extrabold sm:col-span-2">Edit coach profile</h3><input value={phone} onChange={(event) => setPhone(event.target.value)} aria-label="Coach phone" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input value={certification} onChange={(event) => setCertification(event.target.value)} aria-label="Coach certification" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><textarea value={bio} onChange={(event) => setBio(event.target.value)} aria-label="Coach biography" rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" /><button onClick={() => app.updateCoachProfile(coach.id, { bio, phone, certification })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold sm:col-span-2">Save profile</button></div>}
      <div className="space-y-2">{app.coachAttendance.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"><Clock3 className="h-4 w-4 text-slate-400" /><div className="flex-1"><p className="text-sm font-bold">{item.coachName}</p><p className="text-xs text-slate-500">{item.date} · {item.checkInTime}{item.checkOutTime ? `–${item.checkOutTime}` : ''}</p></div><span className="text-[11px] font-bold text-amber-800">{item.isVerifiedForPayroll ? 'Verified' : 'Unverified'}</span></div>)}</div>
      {role === 'ADMIN' && <form onSubmit={(event) => void createCoachAccount(event)} className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><h3 className="text-sm font-extrabold sm:col-span-2">Create coach account</h3><input required value={newCoachName} onChange={(event) => setNewCoachName(event.target.value)} placeholder="Coach full name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input required type="email" value={newCoachEmail} onChange={(event) => setNewCoachEmail(event.target.value)} placeholder="Email / login ID" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input required value={newCoachPhone} onChange={(event) => setNewCoachPhone(event.target.value)} placeholder="Phone, e.g. +15550192831" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input required value={newCoachCertification} onChange={(event) => setNewCoachCertification(event.target.value)} placeholder="Certification" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select required multiple value={newCoachSportIds} onChange={(event) => setNewCoachSportIds(Array.from(event.target.selectedOptions, (option) => option.value as SportId))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2">{SPORTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button disabled={creatingCoach} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">{creatingCoach ? 'Creating…' : 'Create coach login'}</button>{newCoachCredentials && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 sm:col-span-2">One-time credentials — ID: <strong>{newCoachCredentials.username}</strong> · password: <strong>{newCoachCredentials.password}</strong>. Save securely now.</p>}</form>}
      {role === 'ADMIN' && <div className="mt-4 space-y-2">{app.coaches.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-slate-500">{item.certification} · {item.isCheckedInToday ? 'On shift' : 'Off shift'}</p><p className="mt-1 text-xs text-slate-400">{app.coachAssignments.filter((assignment) => assignment.coachId === item.id).map((assignment) => SPORTS.find((sport) => sport.id === assignment.sportId)?.name).filter(Boolean).join(', ')}</p></div>)}</div>}
    </section>
  );
}

function CommunicationsPanel({ role }: { role: UserRole }) {
  const app = useApp();
  const [message, setMessage] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState<'ALL' | 'COACH' | 'STUDENT'>('ALL');
  const [targetType, setTargetType] = useState<'ALL_PARENTS' | 'SPORT' | 'BATCH'>('ALL_PARENTS');
  const [targetValue, setTargetValue] = useState('');
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    const succeeded = await app.sendEmergencyBroadcast({
      targetType,
      targetValue: targetType === 'ALL_PARENTS' ? undefined : targetValue,
      templateKey: 'CUSTOM',
      templateTitle: 'Academy update',
      messageContent: message.trim(),
      channel: 'WHATSAPP',
    });
    setSending(false);
    if (succeeded) setMessage('');
  };
  const publishAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim() || !app.currentUser) return;
    const result = await apiPut('/api/state', {
      state: {
        students: app.students,
        coaches: app.coaches,
        enrollments: app.enrollments,
        coachAssignments: app.coachAssignments,
        attendance: app.attendance,
        announcements: [{
          id: `ann-${crypto.randomUUID()}`,
          title: announcementTitle.trim(),
          body: announcementBody.trim(),
          audience: announcementAudience,
          createdAt: new Date().toISOString(),
          authorName: app.currentUser.name,
          pinned: false,
        }, ...app.announcements],
        archivedStudents: app.archivedStudents,
        facilities: app.facilities,
        bookings: app.bookings,
        coachAttendance: app.coachAttendance,
        invoices: app.invoices,
        payroll: app.payroll,
        broadcasts: app.broadcasts,
        incidents: app.incidents,
        media: app.media,
      },
    });
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Announcement not published', description: result.message });
      return;
    }
    setAnnouncementTitle('');
    setAnnouncementBody('');
    app.addToast({ type: 'success', title: 'Announcement published', description: 'It is now available to the selected audience.' });
    await app.refreshFromServer();
  };
  return (
    <section>
      <SectionTitle title="Communications" detail="Academy announcements and message outbox." />
      {role === 'ADMIN' && <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><p className="text-sm font-bold sm:col-span-2">Publish an in-app announcement</p><input value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} placeholder="Announcement title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><select value={announcementAudience} onChange={(event) => setAnnouncementAudience(event.target.value as typeof announcementAudience)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="ALL">Everyone</option><option value="COACH">Coaches</option><option value="STUDENT">Students</option></select><textarea value={announcementBody} onChange={(event) => setAnnouncementBody(event.target.value)} rows={2} placeholder="Announcement text" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" /><button onClick={() => void publishAnnouncement()} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white sm:col-span-2">Publish</button></div>}
      {role === 'ADMIN' && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="mb-2 text-sm font-bold text-amber-950">Send to explicitly opted-in guardians</p><div className="mb-2 grid gap-2 sm:grid-cols-2"><select value={targetType} onChange={(event) => setTargetType(event.target.value as typeof targetType)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"><option value="ALL_PARENTS">All opted-in guardians</option><option value="SPORT">By sport</option><option value="BATCH">By batch</option></select>{targetType === 'SPORT' ? <select value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"><option value="">Choose sport</option>{SPORTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : targetType === 'BATCH' ? <select value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"><option value="">Choose batch</option>{Array.from(new Set(app.students.map((item) => item.batchShift))).map((batch) => <option key={batch} value={batch}>{batch}</option>)}</select> : null}</div><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} placeholder="Write the message…" className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" /><button disabled={sending || (targetType !== 'ALL_PARENTS' && !targetValue)} onClick={() => void send()} className="mt-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send broadcast'}</button><p className="mt-2 text-xs text-amber-900">Only guardians with a recorded opt-in and a valid phone are contacted. Provider acceptance is recorded; actual delivery receipts require provider webhooks.</p></div>}
      <div className="space-y-2">{app.announcements.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.body}</p><p className="mt-2 text-xs text-slate-400">{item.authorName} · {item.createdAt}</p></article>)}</div>
      {app.broadcasts.length > 0 && <div className="mt-5 space-y-2">{app.broadcasts.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold"><Megaphone className="h-4 w-4" />{item.templateTitle}<span className="ml-auto text-xs font-bold text-amber-700">{item.deliveryStatus}</span></div><p className="mt-2 text-sm text-slate-600">{item.messageContent}</p><p className="mt-2 text-xs text-slate-400">{item.deliveredCount}/{item.recipientCount} delivered · {new Date(item.sentAt).toLocaleString()}</p></div>)}</div>}
      {role !== 'ADMIN' && app.announcements.length === 0 && app.broadcasts.length === 0 && <Empty>No updates are available.</Empty>}
    </section>
  );
}

function SafetyPanel({ role }: { role: UserRole }) {
  const app = useApp();
  const [studentId, setStudentId] = useState(app.students[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const report = () => {
    const student = app.students.find((item) => item.id === studentId);
    if (!student || !description.trim()) return;
    const sport = app.enrollments.find((item) => item.studentId === student.id && app.mySports.includes(item.sportId))?.sportId ?? app.mySports[0];
    if (!sport) return;
    app.createIncidentReport({ studentId, studentName: `${student.firstName} ${student.lastName}`, sport, severity, bodyPart: 'Not specified', description: description.trim(), treatmentGiven: 'Assessment pending', reportedByCoachName: app.currentUser?.name ?? 'Academy Staff', followUpRequired: severity === 'HIGH' || severity === 'CRITICAL' });
    setDescription('');
  };
  return (
    <section>
      <SectionTitle title="Incident reporting" detail="Reports are saved to the shared academy record; guardian notifications are not sent automatically." />
      {role === 'COACH' && <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3"><select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{app.students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}</select><select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Incident description" rows={2} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3" /><button onClick={report} className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-bold text-white sm:col-span-3">File report</button></div>}
      {app.incidents.length === 0 ? <Empty>No incident reports are available.</Empty> : app.incidents.map((item) => <article key={item.id} className="mb-2 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold"><ShieldAlert className="h-4 w-4 text-rose-600" />{item.studentName}<span className="ml-auto">{item.severity}</span></div><p className="mt-2 text-sm text-slate-600">{item.description}</p><p className="mt-2 text-xs text-slate-400">{item.reportedByCoachName} · {new Date(item.timestamp).toLocaleString()} · Guardian notified: {item.parentNotified ? 'yes' : 'no'}</p></article>)}
    </section>
  );
}

function MediaPanel({ role }: { role: UserRole }) {
  const app = useApp();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sport, setSport] = useState<SportId>(app.mySports[0] ?? 'badminton');
  const upload = () => {
    if (!title.trim() || !url.startsWith('https://') || !app.currentUser) {
      app.addToast({ type: 'error', title: 'Media not added', description: 'Enter a title and secure https:// media URL.' });
      return;
    }
    app.uploadMediaItem({ title: title.trim(), sport, mediaUrl: url, thumbnailUrl: url, category: 'Training', uploadedBy: app.currentUser.name, taggedStudentNames: [] });
    setTitle(''); setUrl('');
  };
  return (
    <section>
      <SectionTitle title="Academy media" detail="Uploads are metadata links; files are not copied to the server. Staff submissions await admin approval." />
      <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Media title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><input value={url} onChange={(event) => setUrl(event.target.value)} type="url" placeholder="https://…" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" /><select value={sport} onChange={(event) => setSport(event.target.value as SportId)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{SPORTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={upload} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white sm:col-span-4">Add media link</button></div>
      {app.media.length === 0 ? <Empty>No approved or submitted media is available.</Empty> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{app.media.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><img src={item.thumbnailUrl} alt="" className="h-40 w-full object-cover" /><div className="p-3"><p className="text-sm font-bold">{item.title}</p><p className="text-xs text-slate-500">{item.sport} · {item.category} · {item.isApproved ? 'Published' : 'Awaiting approval'}</p>{role === 'ADMIN' && <button onClick={() => app.toggleApproveMedia(item.id)} className="mt-2 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">{item.isApproved ? 'Remove approval' : 'Approve'}</button>}</div></article>)}</div>}
    </section>
  );
}

function ArchivePanel() {
  const app = useApp();
  return <section><SectionTitle title="Student archive" detail="Archived records can be restored by an administrator." />{app.archivedStudents.length === 0 ? <Empty>No archived students.</Empty> : app.archivedStudents.map((item) => <div key={item.id} className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><Archive className="h-4 w-4 text-amber-600" /><div className="flex-1"><p className="text-sm font-bold">{item.fullName} · {item.studentCode}</p><p className="text-xs text-slate-500">{item.archivalReason} · {item.archivedAt}</p></div><button onClick={() => app.restoreArchivedStudent(item.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Restore</button></div>)}</section>;
}

function ImportPanel() {
  const app = useApp();
  const [json, setJson] = useState('[]');
  const [result, setResult] = useState('');
  const [credentials, setCredentials] = useState<Array<{ studentCode: string; username: string; password: string }>>([]);
  const [working, setWorking] = useState(false);
  const importRows = async () => {
    try {
      const rows: unknown = JSON.parse(json);
      if (!Array.isArray(rows)) throw new Error('Import expects a JSON array.');
      const validation = app.validateBulkIngestionData(rows);
      if (validation.errorCount > 0) throw new Error(`${validation.errorCount} rows failed validation.`);
      setWorking(true);
      const outcome = await app.executeBulkIngest(validation.validRows);
      setCredentials(outcome.credentials);
      setResult(`Created ${outcome.inserted} student records; ${outcome.errors} failed.`);
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      setWorking(false);
    }
  };
  return <section><SectionTitle title="Bulk student import" detail="Provide a JSON array following the student import fields. Login credentials are generated per student." /><textarea value={json} onChange={(event) => setJson(event.target.value)} rows={12} className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs" /><button disabled={working} onClick={() => void importRows()} className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{working ? 'Importing…' : 'Validate and import'}</button>{result && <p role="status" className="mt-3 text-sm text-slate-600">{result}</p>}{credentials.length > 0 && <div className="mt-4 overflow-x-auto rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="mb-2 text-sm font-bold text-amber-950">One-time student credentials — save securely now</p><table className="w-full text-left text-xs"><thead><tr><th className="p-1">Code</th><th className="p-1">Login ID</th><th className="p-1">Temporary password</th></tr></thead><tbody>{credentials.map((item) => <tr key={item.studentCode}><td className="p-1">{item.studentCode}</td><td className="p-1">{item.username}</td><td className="p-1 font-mono">{item.password}</td></tr>)}</tbody></table></div>}</section>;
}
