'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive, Award, BarChart3, CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign,
  ClipboardCheck, Clock3, FileText, FileUp, Home, Image, Inbox, LogOut, Mail, MapPin, Megaphone,
  MessageSquare, Phone, Plus, RefreshCw, ShieldAlert, Trophy, User, Users, UserRoundCheck, Wallet, X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiGet, apiPost, apiPut, apiRequest } from '@/lib/apiClient';
import { SportId, SPORTS, sportName } from '@/lib/sports';
import { Achievement, Announcement, MediaItem, UserRole } from '@/types';
import { IconComponent } from '@/lib/icons';
import { AcademyEvent, SCHEDULE_DAYS, ScheduleSlot, UPCOMING_EVENTS, WEEK_SCHEDULE } from '@/data/publicSiteData';
import { BottomNav } from './BottomNav';
import { Logo } from './Logo';
import { SportIcon } from './SportIcon';
import { ThemeToggle } from './ThemeToggle';
import { EmptyState, ErrorState, LoadingState } from './ui';

export type PortalTab =
  | 'overview'
  | 'calendar'
  | 'students'
  | 'attendance'
  | 'facilities'
  | 'finance'
  | 'staff'
  | 'communications'
  | 'notifications'
  | 'safety'
  | 'media'
  | 'archives'
  | 'reports'
  | 'import';

const TAB_LABEL: Record<PortalTab, string> = {
  overview: 'Overview',
  calendar: 'Schedule & events',
  students: 'Students',
  attendance: 'Attendance',
  facilities: 'Facilities',
  finance: 'Fees & payroll',
  staff: 'Coach shifts',
  communications: 'Communications',
  notifications: 'Notification history',
  safety: 'Incidents',
  media: 'Media gallery',
  archives: 'Archives',
  reports: 'Reports',
  import: 'Bulk import',
};

const ROLE_TABS: Record<UserRole, PortalTab[]> = {
  ADMIN: ['overview', 'calendar', 'students', 'attendance', 'facilities', 'finance', 'staff', 'communications', 'notifications', 'safety', 'media', 'archives', 'reports', 'import'],
  COACH: ['overview', 'calendar', 'students', 'attendance', 'facilities', 'staff', 'communications', 'notifications', 'safety', 'media'],
  STUDENT: ['overview', 'calendar', 'attendance', 'facilities', 'finance', 'communications', 'media'],
};

const TAB_ICON: Record<PortalTab, IconComponent> = {
  overview: Home,
  calendar: CalendarDays,
  students: Users,
  attendance: CalendarDays,
  facilities: ClipboardCheck,
  finance: Wallet,
  staff: UserRoundCheck,
  communications: MessageSquare,
  notifications: MessageSquare,
  safety: ShieldAlert,
  media: Image,
  archives: Archive,
  reports: BarChart3,
  import: FileUp,
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
  return <EmptyState title={typeof children === 'string' ? children : 'Nothing to show yet'} icon={<Inbox className="h-8 w-8" />} />;
}

export function PortalPage({ role, initialTab = 'overview' }: { role: UserRole; initialTab?: PortalTab }) {
  const app = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<PortalTab>(initialTab);
  const [selectedSport, setSelectedSport] = useState<SportId>(app.mySports[0] ?? 'badminton');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [refreshError, setRefreshError] = useState('');

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
    setRefreshError('');
    setNotice('');
    try {
      await app.refreshFromServer();
      setNotice('Latest shared data loaded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not refresh shared data.';
      setRefreshError(message);
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
    <div className="min-h-dvh bg-surface-2">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-line dark:bg-surface/95">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Logo size="sm" showWordmark={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-50">Vendhan Sports Academy</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{app.currentUser?.name} · {role}</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:flex dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className={`h-2 w-2 rounded-full ${app.isSyncing ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
            {app.isSyncing ? 'Syncing' : 'Live · 5 sec'}
          </span>
          <ThemeToggle />
          <button onClick={() => void refresh()} disabled={busy} aria-label="Refresh shared data" title="Refresh shared data" className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-white/10">
            <RefreshCw className={`h-[18px] w-[18px] ${busy ? 'animate-spin' : ''}`} strokeWidth={2.1} />
          </button>
          <button onClick={() => void signOut()} aria-label="Sign out" title="Sign out" className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10">
            <LogOut className="h-[18px] w-[18px]" strokeWidth={2.1} />
          </button>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 no-scrollbar sm:px-6" aria-label="Portal sections">
          {tabs.map((key) => {
            const Icon = TAB_ICON[key];
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key ? 'page' : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${tab === key ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}
              >
                <span aria-hidden="true"><Icon className="h-4 w-4" /></span>
                {TAB_LABEL[key]}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6">
        {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
        {refreshError && <div className="mb-4"><ErrorState title="Could not refresh" message={refreshError} onRetry={() => void refresh()} /></div>}
        {tab === 'overview' && <Overview role={role} onTabChange={setTab} onProfile={() => router.push('/student/profile')} />}
        {tab === 'calendar' && <ScheduleEventsPanel role={role} />}
        {tab === 'students' && <StudentDirectory role={role} />}
        {tab === 'attendance' && (
          <AttendancePanel role={role} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedSport={selectedSport} setSelectedSport={setSelectedSport} records={todayRecords} />
        )}
        {tab === 'facilities' && <FacilitiesPanel role={role} />}
        {tab === 'finance' && <FinancePanel role={role} />}
        {tab === 'staff' && <StaffPanel role={role} />}
        {tab === 'communications' && <CommunicationsPanel role={role} />}
        {tab === 'notifications' && <NotificationHistoryPanel />}
        {tab === 'safety' && <SafetyPanel role={role} />}
        {tab === 'media' && <MediaPanel role={role} />}
        {tab === 'archives' && <ArchivePanel />}
        {tab === 'reports' && <ReportsPanel />}
        {tab === 'import' && <ImportPanel />}
      </main>

      <BottomNav role={role} />
    </div>
  );
}

function Overview({ role, onTabChange, onProfile }: { role: UserRole; onTabChange: (tab: PortalTab) => void; onProfile: () => void }) {
  const app = useApp();
  const { students, attendance, invoices, bookings, myStudent, coaches, isSyncing } = app;
  if (role === 'STUDENT') return <StudentOverview onTabChange={onTabChange} onProfile={onProfile} />;

  const pendingFees = invoices.filter((invoice) => invoice.status !== 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0);
  const cards = [
    { label: 'Students in view', value: students.length, Icon: Users },
    { label: 'Attendance records', value: attendance.length, Icon: UserRoundCheck },
    { label: 'Upcoming bookings', value: bookings.filter((booking) => booking.status !== 'CANCELLED').length, Icon: CalendarDays },
    { label: role === 'ADMIN' ? 'Outstanding fees' : 'My outstanding fees', value: `$${pendingFees.toLocaleString()}`, Icon: CircleDollarSign },
  ];
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-indigo-950 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Operations portal</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Welcome, {app.currentUser?.name}</h1>
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
    </div>
  );
}

function StudentOverview({ onTabChange, onProfile }: { onTabChange: (tab: PortalTab) => void; onProfile: () => void }) {
  const app = useApp();
  const [academySchedule, setAcademySchedule] = useState<ScheduleSlot[]>(WEEK_SCHEDULE);
  const [academyEvents, setAcademyEvents] = useState<AcademyEvent[]>(UPCOMING_EVENTS);
  useEffect(() => {
    let cancelled = false;
    void apiGet<{ schedule: ScheduleSlot[]; events: AcademyEvent[] }>('/api/academy-content').then((result) => {
      if (!cancelled && result.ok && result.data) {
        setAcademySchedule(result.data.schedule);
        setAcademyEvents(result.data.events);
      }
    });
    return () => { cancelled = true; };
  }, []);
  const student = app.myStudent;
  const now = new Date();
  const today = formatLocalDate(now);
  const month = today.slice(0, 7);
  const studentSports = app.mySports;
  const fullName = student ? `${student.firstName} ${student.lastName}` : app.currentUser?.name ?? 'Athlete';
  const coach = student ? app.coaches.find((item) => item.id === student.primaryAssignedCoachId) : undefined;
  const attendance = student ? app.studentAttendanceSummary(student.id) : null;
  const monthlyAttendance = student ? app.studentAttendanceSummary(student.id, month) : null;
  const currentMonthAttendance = monthlyAttendance?.percentage ?? 0;
  const studentInvoices = app.invoices.filter((invoice) => invoice.studentId === student?.id && invoice.status !== 'PAID');
  const outstandingFees = studentInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const studentBookings = app.bookings
    .filter((booking) => booking.status !== 'CANCELLED' && (booking.bookedByUserId === student?.id || booking.bookedByUserId === app.currentUser?.id || booking.bookedByName === fullName))
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  const activeSports = SPORTS.filter((sport) => studentSports.includes(sport.id));
  const scheduleForStudent = academySchedule.filter((slot) =>
    studentSports.includes(slot.sportId) && (!student?.batchShift || slot.batch === student.batchShift)
  );
  const upcomingSchedule = scheduleForStudent
    .map((slot) => {
      const slotDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(slot.day);
      const todayIndex = (now.getDay() + 6) % 7;
      let dayOffset = (slotDay - todayIndex + 7) % 7;
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (dayOffset === 0 && slot.startTime <= currentTime) dayOffset = 7;
      return { ...slot, dayOffset };
    })
    .sort((a, b) => a.dayOffset - b.dayOffset || a.startTime.localeCompare(b.startTime));
  const nextSession = upcomingSchedule[0];
  const weekSchedule = scheduleForStudent.slice(0, 5);
  const announcements = app.announcements
    .filter((item) => (item.audience === 'ALL' || item.audience === 'STUDENT') && (!item.sportId || studentSports.includes(item.sportId)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const photos = app.media
    .filter((item) => item.isApproved && (item.taggedStudentNames.includes(fullName) || studentSports.includes(item.sport)))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 6);
  const events = academyEvents
    .filter((event) => event.date >= today)
    .slice(0, 5);
  const recentActivities = [
    ...(student ? attendance?.byDate.slice(0, 3).map((record) => ({
      date: record.date,
      title: record.status === 'present' ? `${sportName(record.sportId)} session attended` : `${sportName(record.sportId)} attendance recorded`,
      detail: record.status === 'present' ? 'Training session' : 'Attendance update',
      Icon: CheckCircle2,
      tone: 'text-emerald-700 bg-emerald-100',
    })) ?? [] : []),
    ...(student?.achievements.slice(0, 3).map((achievement) => ({
      date: achievement.awardedDate,
      title: achievement.title,
      detail: achievement.description,
      Icon: Trophy,
      tone: 'text-amber-700 bg-amber-100',
    })) ?? []),
    ...announcements.slice(0, 1).map((item) => ({
      date: item.createdAt.slice(0, 10),
      title: item.title,
      detail: 'Academy announcement',
      Icon: Megaphone,
      tone: 'text-sky-700 bg-sky-100',
    })),
    ...photos.slice(0, 1).map((item) => ({
      date: item.uploadedAt,
      title: item.title,
      detail: 'New photo highlight',
      Icon: Image,
      tone: 'text-rose-700 bg-rose-100',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const badges = [
    ...(monthlyAttendance && monthlyAttendance.total > 0 && monthlyAttendance.absent === 0 ? ['Perfect attendance this month'] : []),
    ...(attendance && attendance.total >= 50 ? ['50+ sessions'] : []),
    ...(student?.achievements.slice(0, 3).map((achievement) => achievement.title) ?? []),
  ].slice(0, 5);
  const eventCategory = (type: string) => type === 'Trial Camp' ? 'Camp' : type === 'Time Trials' || type === 'Training' ? 'Training' : type === 'Sports Day' || type === 'Celebration' ? 'Celebration' : 'Tournament';
  const eventTone: Record<string, string> = {
    Tournament: 'bg-amber-100 text-amber-800',
    Camp: 'bg-emerald-100 text-emerald-800',
    Training: 'bg-sky-100 text-sky-800',
    Celebration: 'bg-rose-100 text-rose-800',
  };
  const currentWeekBookings = studentBookings.filter((booking) => booking.date >= today).slice(0, 3);
  const academyFacilities = app.facilities.slice(0, 3);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long' }).format(now);
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(now);

  return (
    <div className="space-y-7">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 21px, rgba(255,255,255,.12) 22px 23px)' }} />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Your academy, your progress</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Welcome back, {student?.firstName ?? app.currentUser?.name?.split(' ')[0] ?? 'Athlete'}</h1>
            <p className="mt-2 text-sm text-slate-200">{activeSports.map((sport) => sport.name).join(' · ') || 'Your sports'}{student?.batchShift ? ` · ${student.batchShift}` : ''}</p>
            <p className="mt-1 text-sm text-slate-300">{coach?.name ? `Training with ${coach.name}` : 'Coach details will appear here'} <span className="mx-1 text-slate-500">·</span>{dateLabel}</p>
          </div>
          {student?.photoUrl && <img src={student.photoUrl} alt={`${fullName} profile`} className="h-16 w-16 rounded-2xl border border-white/20 object-cover shadow-md" />}
        </div>
        <div className="mt-7 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-200"><Clock3 className="h-4 w-4" /></span>
            <div><p className="text-xs text-slate-300">Next session</p><p className="mt-1 text-sm font-bold">{nextSession ? `${nextSession.day} · ${nextSession.startTime}` : 'No session listed yet'}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-sky-200"><CalendarDays className="h-4 w-4" /></span>
            <div><p className="text-xs text-slate-300">Attendance in {monthLabel}</p><p className="mt-1 text-sm font-bold">{monthlyAttendance?.total ? `${currentMonthAttendance}%` : 'No records yet'}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-amber-200"><CircleDollarSign className="h-4 w-4" /></span>
            <div><p className="text-xs text-slate-300">Outstanding fees</p><p className="mt-1 text-sm font-bold">${outstandingFees.toLocaleString()}</p></div>
          </div>
        </div>
      </section>

      <section aria-label="Student overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StudentStatCard label="My profile" value={student ? 'View your details' : 'Profile not found'} Icon={User} tone="sky" onClick={onProfile} />
        <StudentStatCard label="Attendance" value={attendance?.total ? `${attendance.percentage}%` : 'No records yet'} Icon={CheckCircle2} tone="emerald" progress={attendance?.percentage ?? 0} onClick={() => onTabChange('attendance')} />
        <StudentStatCard label="Bookings" value={`${studentBookings.length} upcoming`} Icon={CalendarDays} tone="amber" onClick={() => onTabChange('facilities')} />
        <StudentStatCard label="Fees" value={outstandingFees === 0 ? 'All clear' : `$${outstandingFees.toLocaleString()} due`} Icon={CircleDollarSign} tone={outstandingFees === 0 ? 'emerald' : 'rose'} onClick={() => onTabChange('finance')} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle title="About Vendhan Sports Academy" detail="A little more about the place you train." />
          <div className="grid gap-5 md:grid-cols-[1.25fr_.75fr]">
            <div className="space-y-4">
              <div><p className="text-sm font-bold text-slate-800">Our story</p><p className="mt-1 text-sm leading-relaxed text-slate-600">[Academy story and student-friendly bio to be added by an admin.]</p></div>
              <div><p className="text-sm font-bold text-slate-800">Our mission</p><p className="mt-1 text-sm leading-relaxed text-slate-600">[Academy mission statement to be added by an admin.]</p></div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-slate-500">Established</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">[Year to be confirmed]</span></div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-800">Sports at the academy</p>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((sport) => <span key={sport.id} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${sport.accent.soft} ${sport.accent.text}`}><SportIcon sportId={sport.id} className="h-4 w-4" />{sport.short}</span>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-800">Facilities</p>
                <div className="flex flex-wrap gap-2">{academyFacilities.length ? academyFacilities.map((facility) => <span key={facility.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{facility.name}</span>) : <span className="text-sm text-slate-500">[Facility highlights to be added by an admin.]</span>}</div>
              </div>
            </div>
            <aside className="space-y-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {coach?.avatar ? <img src={coach.avatar} alt={`${coach.name} portrait`} className="h-14 w-14 rounded-full object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><User className="h-6 w-6" /></span>}
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your coach</p><p className="mt-0.5 font-bold text-slate-900">{coach?.name ?? 'Coach profile to be added'}</p></div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{coach?.bio || '[Coach introduction to be added by an admin.]'}</p>
              <p className="border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500">Academy founder / head coach profile: [confirm name and details]</p>
            </aside>
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { Icon: MapPin, label: 'Address', value: '[Add academy address]' },
              { Icon: Phone, label: 'Phone', value: '[Add contact number]' },
              { Icon: Mail, label: 'Email', value: '[Add academy email]' },
              { Icon: Clock3, label: 'Timings', value: '[Add opening hours]' },
            ].map(({ Icon, label, value }) => <div key={label} className="flex gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-0.5 text-xs text-slate-700">{value}</p></div></div>)}
          </div>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle title="This week's schedule" detail="Sessions for your sport and batch." />
          {weekSchedule.length || currentWeekBookings.length ? <div className="space-y-3">
            {weekSchedule.map((slot) => <div key={slot.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0"><span className="w-12 shrink-0 pt-0.5 text-xs font-bold text-emerald-700">{slot.day.slice(0, 3)}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{sportName(slot.sportId)} · {slot.startTime}</p><p className="mt-0.5 truncate text-xs text-slate-500">{slot.venue} · {slot.coach}</p></div></div>)}
            {currentWeekBookings.map((booking) => <div key={booking.id} className="flex gap-3 border-b border-slate-100 pb-3 last:border-0"><span className="w-12 shrink-0 pt-0.5 text-xs font-bold text-sky-700">{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${booking.date}T12:00:00`))}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{booking.facilityName} · {booking.startTime}</p><p className="mt-0.5 text-xs text-slate-500">Personal booking · {booking.date}</p></div></div>)}
          </div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No sessions are listed for your sports yet.</p>}
          <button onClick={() => onTabChange('facilities')} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-bold text-emerald-800 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Explore facilities <ChevronRight className="h-4 w-4" /></button>
        </section>
      </section>

      <section>
        <SectionTitle title="Upcoming events" detail="What's happening around the academy." />
        {events.length ? <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
          {events.map((event) => {
            const date = new Date(`${event.date}T12:00:00`);
            const category = eventCategory(event.type);
            return <article key={event.id} className="w-64 shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-72">
              <div className="flex items-start justify-between gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-center"><span className="text-[10px] font-bold uppercase text-emerald-700">{new Intl.DateTimeFormat('en', { month: 'short' }).format(date)}</span><span className="-mt-1 text-lg font-black text-emerald-950">{date.getDate()}</span></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${eventTone[category]}`}>{category}</span></div>
              <h3 className="mt-4 line-clamp-2 min-h-10 text-sm font-extrabold text-slate-900">{event.title}</h3>
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-600"><Clock3 className="h-3.5 w-3.5 shrink-0" />{event.time}</p>
              <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0" />{event.venue}</p>
            </article>;
          })}
        </div> : <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No upcoming events yet. Check back soon!</p>}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <SectionTitle title="Recent activities" detail="Your latest progress and academy updates." />
          {recentActivities.length ? <ol className="space-y-4">{recentActivities.map((activity, index) => <li key={`${activity.date}-${activity.title}-${index}`} className="flex gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${activity.tone}`}><activity.Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1 border-b border-slate-100 pb-3 last:border-0"><p className="text-sm font-bold text-slate-800">{activity.title}</p><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{activity.detail}</p><time className="mt-1 block text-[11px] text-slate-400" dateTime={activity.date}>{formatDisplayDate(activity.date)}</time></div></li>)}</ol> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Your activity will show up here as you train and take part.</p>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3"><SectionTitle title="Announcements" detail="The latest notes from your academy." /><button onClick={() => onTabChange('communications')} className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-bold text-emerald-800 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">All <ChevronRight className="h-4 w-4" /></button></div>
          {app.isSyncing && announcements.length === 0 ? <div className="animate-pulse space-y-3" aria-label="Loading announcements"><div className="h-4 w-3/4 rounded bg-slate-100" /><div className="h-3 rounded bg-slate-100" /><div className="h-3 w-2/3 rounded bg-slate-100" /></div> : announcements.length ? <div className="divide-y divide-slate-100">{announcements.map((item) => <article key={item.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-bold text-slate-800">{item.title}</h3>{item.pinned && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Pinned</span>}</div><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{item.body}</p><p className="mt-2 text-[11px] text-slate-400">{item.authorName} · {formatDisplayDate(item.createdAt.slice(0, 10))}</p></article>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No announcements yet. Check back soon!</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3"><SectionTitle title="Photo highlights" detail="Moments from training and competition." /><button onClick={() => onTabChange('media')} aria-label="View all photos" className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-bold text-emerald-800 transition-colors hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">View all <ChevronRight className="h-4 w-4" /></button></div>
        {app.isSyncing && photos.length === 0 ? <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Loading photo highlights">{Array.from({ length: 4 }, (_, index) => <div key={index} className="aspect-[4/3] rounded-xl bg-slate-100" />)}</div> : photos.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{photos.map((photo) => <figure key={photo.id} className="group overflow-hidden rounded-xl bg-slate-100"><img src={photo.thumbnailUrl || photo.mediaUrl} alt={photo.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" /><figcaption className="truncate px-2.5 py-2 text-xs font-semibold text-slate-700">{photo.title}</figcaption></figure>)}</div> : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No photo highlights yet. Your academy moments will appear here.</p>}
      </section>

      <section aria-labelledby="progress-badges-heading">
        <div className="mb-4"><h2 id="progress-badges-heading" className="text-xl font-extrabold text-slate-900">Your achievements</h2><p className="mt-1 text-sm text-slate-500">Milestones earned from your academy record.</p></div>
        {badges.length ? <div className="flex flex-wrap gap-2">{badges.map((badge, index) => <span key={`${badge}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900"><Award className="h-4 w-4" />{badge}</span>)}</div> : <p className="text-sm text-slate-500">Your first milestone is just around the corner.</p>}
      </section>

      {!student && <p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">Your student profile is not available yet. Please check with the academy administrator.</p>}
    </div>
  );
}

function StudentStatCard({ label, value, Icon, tone, progress, onClick }: {
  label: string;
  value: string;
  Icon: IconComponent;
  tone: 'sky' | 'emerald' | 'amber' | 'rose';
  progress?: number;
  onClick: () => void;
}) {
  const toneClasses = {
    sky: 'bg-sky-100 text-sky-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
  };
  return <button onClick={onClick} className="group min-h-32 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
    <span className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-xl ${toneClasses[tone]}`}><Icon className="h-5 w-5" /></span><ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" /></span>
    <span className="mt-3 block text-xs font-semibold text-slate-500">{label}</span>
    <span className="mt-1 block text-lg font-black text-slate-900">{value}</span>
    {progress !== undefined && <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100" aria-label={`${progress}% attendance`}><span className="block h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></span>}
  </button>;
}

function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(date: string) {
  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(parsed);
}

type NotificationPreviewTarget = {
  resource: 'event' | 'announcement' | 'achievement';
  id: string;
  title: string;
  message: string;
  eventAction?: 'created' | 'updated' | 'cancelled';
  event?: AcademyEvent;
};

function NotificationPreview({ target, onSkip }: { target: NotificationPreviewTarget; onSkip: () => void }) {
  const app = useApp();
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState<{ queued: number; skippedNoConsent: number; skippedInvalid: number; shareUrl: string; copyMessage: string } | null>(null);
  const send = async () => {
    setSending(true);
    const result = await apiPost<{ result: typeof queued extends infer T ? Exclude<T, null> : never }>('/api/notifications', {
      action: 'preview', resource: target.resource, id: target.id, eventAction: target.eventAction, event: target.event,
    });
    setSending(false);
    if (!result.ok || !result.data) {
      app.addToast({ type: 'error', title: 'Notification not queued', description: result.message });
      return;
    }
    setQueued(result.data.result);
    app.addToast({ type: 'success', title: 'Notification queued', description: `${result.data.result.queued} opted-in guardian(s) queued; ${result.data.result.skippedNoConsent} without consent and ${result.data.result.skippedInvalid} with invalid phone skipped.` });
  };
  return <aside className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4" aria-label="Notification preview">
    <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Notification preview · {target.title}</p>
    <p className="mt-2 rounded-xl bg-white p-3 text-sm leading-relaxed text-slate-700">{target.message}</p>
    {!queued ? <div className="mt-3 flex flex-wrap gap-2"><button disabled={sending} onClick={() => void send()} className="min-h-10 rounded-lg bg-sky-700 px-3 text-xs font-bold text-white disabled:opacity-50">{sending ? 'Queueing…' : 'Send notification'}</button><button onClick={onSkip} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-600">Skip</button></div> : <div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={() => void navigator.clipboard.writeText(queued.copyMessage).then(() => app.addToast({ type: 'success', title: 'Message copied' })).catch(() => app.addToast({ type: 'error', title: 'Could not copy message' }))} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700">Copy message</button><a href={queued.shareUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white">Share to WhatsApp group</a><button onClick={onSkip} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-600">Close</button></div>}
  </aside>;
}

function ScheduleEventsPanel({ role }: { role: UserRole }) {
  const app = useApp();
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [events, setEvents] = useState<AcademyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState('');
  const [editingEventId, setEditingEventId] = useState('');
  const [urgentChange, setUrgentChange] = useState(false);
  const [urgentReason, setUrgentReason] = useState('Rain');
  const [customUrgentReason, setCustomUrgentReason] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [pendingNotification, setPendingNotification] = useState<NotificationPreviewTarget | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<Omit<ScheduleSlot, 'id'>>({
    day: 'Monday', startTime: '16:00', endTime: '17:00', sportId: app.mySports[0] ?? 'badminton',
    batch: '', coach: app.currentUser?.name ?? '', venue: '', focus: '',
  });
  const [eventDraft, setEventDraft] = useState<Omit<AcademyEvent, 'id'>>({
    title: '', type: 'Tournament', date: new Date().toISOString().slice(0, 10), time: '09:00 - 12:00',
    venue: '', audience: '', spotsLeft: 0, description: '',
  });
  const canManage = role === 'ADMIN' || role === 'COACH';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      const result = await apiGet<{ schedule: ScheduleSlot[]; events: AcademyEvent[] }>('/api/academy-content');
      if (cancelled) return;
      if (!result.ok || !result.data) setError(result.message || 'Could not load academy schedule and events.');
      else {
        setSchedule(result.data.schedule);
        setEvents(result.data.events);
      }
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const acceptContent = (data: { schedule: ScheduleSlot[]; events: AcademyEvent[] }) => {
    setSchedule(data.schedule);
    setEvents(data.events);
  };
  type ContentWriteResponse = {
    schedule: ScheduleSlot[];
    events: AcademyEvent[];
    message: string;
    emergencyNotification?: { queued: number; skippedNoConsent: number; skippedInvalid: number; shareUrl: string };
  };

  const submitSchedule = async (event: FormEvent) => {
    event.preventDefault();
    const reason = urgentReason === 'Other' ? customUrgentReason.trim() : urgentReason;
    if (urgentChange && (!reason || !window.confirm('Confirm this emergency schedule change and immediately notify affected opted-in guardians?'))) return;
    setSaving(true);
    const payload = {
      resource: 'schedule', id: editingScheduleId || undefined, item: scheduleDraft,
      emergency: Boolean(editingScheduleId && urgentChange),
      reason,
      newTiming: `${scheduleDraft.day} ${scheduleDraft.startTime}-${scheduleDraft.endTime}`,
    };
    const result = editingScheduleId
      ? await apiPut<ContentWriteResponse>('/api/academy-content', payload)
      : await apiPost<ContentWriteResponse>('/api/academy-content', payload);
    setSaving(false);
    if (!result.ok || !result.data) {
      app.addToast({ type: 'error', title: 'Schedule not saved', description: result.message });
      return;
    }
    acceptContent(result.data);
    app.addToast({ type: 'success', title: editingScheduleId ? 'Class updated' : 'Class added', description: result.data.message });
    if ('emergencyNotification' in result.data && result.data.emergencyNotification) {
      setShareUrl(result.data.emergencyNotification.shareUrl);
      app.addToast({ type: 'info', title: 'Urgent notices queued', description: `${result.data.emergencyNotification.queued} guardian(s) queued; ${result.data.emergencyNotification.skippedNoConsent} skipped without opt-in and ${result.data.emergencyNotification.skippedInvalid} skipped for invalid phone.` });
    }
    setShowScheduleForm(false);
    setEditingScheduleId('');
    setUrgentChange(false);
    setCustomUrgentReason('');
    setScheduleDraft({ day: 'Monday', startTime: '16:00', endTime: '17:00', sportId: app.mySports[0] ?? 'badminton', batch: '', coach: app.currentUser?.name ?? '', venue: '', focus: '' });
  };

  const submitEvent = async (event: FormEvent) => {
    event.preventDefault();
    const wasEditing = Boolean(editingEventId);
    const savedId = editingEventId;
    setSaving(true);
    const payload = { resource: 'event', id: editingEventId || undefined, item: eventDraft };
    const result = editingEventId
      ? await apiPut<{ schedule: ScheduleSlot[]; events: AcademyEvent[]; message: string }>('/api/academy-content', payload)
      : await apiPost<{ schedule: ScheduleSlot[]; events: AcademyEvent[]; message: string }>('/api/academy-content', payload);
    setSaving(false);
    if (!result.ok || !result.data) {
      app.addToast({ type: 'error', title: 'Event not saved', description: result.message });
      return;
    }
    acceptContent(result.data);
    app.addToast({ type: 'success', title: editingEventId ? 'Event updated' : 'Event created', description: result.data.message });
    const savedEvent = result.data.events.find((item) => item.id === (savedId || result.data.events.find((candidate) => candidate.title === eventDraft.title)?.id));
    if (savedEvent) setPendingNotification({ resource: 'event', id: savedEvent.id, event: savedEvent, eventAction: wasEditing ? 'updated' : 'created', title: savedEvent.title, message: `Vendhan Sports Academy: Event ${wasEditing ? 'updated' : 'created'}: ${savedEvent.title} · ${savedEvent.date} · ${savedEvent.time} · ${savedEvent.venue}. ${savedEvent.description}` });
    setShowEventForm(false);
    setEditingEventId('');
    setEventDraft({ title: '', type: 'Tournament', date: new Date().toISOString().slice(0, 10), time: '09:00 - 12:00', venue: '', audience: '', spotsLeft: 0, description: '' });
  };

  const deleteItem = async (resource: 'schedule' | 'event', id: string, title: string) => {
    const eventBeforeDelete = resource === 'event' ? events.find((event) => event.id === id) : undefined;
    let emergency = false;
    let reason = '';
    if (resource === 'schedule') {
      emergency = window.confirm(`Delete "${title}" as an EMERGENCY change and notify affected opted-in guardians? Click Cancel to choose standard deletion.`);
      if (emergency) {
        reason = window.prompt('Enter reason: rain, coach unavailable, ground issue, or other + details.')?.trim() ?? '';
        if (!reason) return;
      } else if (!window.confirm(`Delete "${title}" without an urgent notification? This cannot be undone.`)) return;
    } else if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setSaving(true);
    const result = await apiRequest<ContentWriteResponse & { deletedEvent?: AcademyEvent }>('/api/academy-content', {
      method: 'DELETE', body: JSON.stringify({ resource, id, emergency, reason }),
    });
    setSaving(false);
    if (!result.ok || !result.data) {
      app.addToast({ type: 'error', title: 'Item not deleted', description: result.message });
      return;
    }
    acceptContent(result.data);
    app.addToast({ type: 'success', title: 'Item deleted', description: result.data.message });
    if (resource === 'schedule' && emergency && result.data.emergencyNotification) {
      setShareUrl(result.data.emergencyNotification.shareUrl);
      app.addToast({ type: 'info', title: 'Emergency notice queued', description: `${result.data.emergencyNotification.queued} guardians queued for ${reason}.` });
    }
    if (resource === 'event' && eventBeforeDelete) setPendingNotification({ resource: 'event', id, event: result.data.deletedEvent ?? eventBeforeDelete, eventAction: 'cancelled', title: eventBeforeDelete.title, message: `Vendhan Sports Academy: Event cancelled: ${eventBeforeDelete.title} · ${eventBeforeDelete.date} · ${eventBeforeDelete.time} · ${eventBeforeDelete.venue}.` });
  };

  return <div className="space-y-8">
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><SectionTitle title="Daily schedule" detail="Class times are checked for coach and ground conflicts." />{canManage && <button onClick={() => { setEditingScheduleId(''); setScheduleDraft({ day: 'Monday', startTime: '16:00', endTime: '17:00', sportId: app.mySports[0] ?? 'badminton', batch: '', coach: app.currentUser?.name ?? '', venue: '', focus: '' }); setShowScheduleForm((value) => !value); }} className="min-h-10 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">{showScheduleForm && !editingScheduleId ? 'Close form' : 'Add class'}</button>}</div>
      {showScheduleForm && canManage && <form onSubmit={(event) => void submitSchedule(event)} className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <select aria-label="Class day" value={scheduleDraft.day} onChange={(event) => setScheduleDraft({ ...scheduleDraft, day: event.target.value as ScheduleSlot['day'] })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm">{SCHEDULE_DAYS.map((day) => <option key={day}>{day}</option>)}</select>
        <select aria-label="Class sport" value={scheduleDraft.sportId} onChange={(event) => setScheduleDraft({ ...scheduleDraft, sportId: event.target.value as SportId })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm">{SPORTS.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select>
        <input required aria-label="Batch name" value={scheduleDraft.batch} onChange={(event) => setScheduleDraft({ ...scheduleDraft, batch: event.target.value })} placeholder="Batch name" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <input required aria-label="Class coach" value={scheduleDraft.coach} onChange={(event) => setScheduleDraft({ ...scheduleDraft, coach: event.target.value })} placeholder="Coach name" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <input required aria-label="Ground or venue" value={scheduleDraft.venue} onChange={(event) => setScheduleDraft({ ...scheduleDraft, venue: event.target.value })} placeholder="Ground / venue" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <div className="flex gap-2"><input required aria-label="Class start time" type="time" value={scheduleDraft.startTime} onChange={(event) => setScheduleDraft({ ...scheduleDraft, startTime: event.target.value })} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-2 text-sm" /><input required aria-label="Class end time" type="time" value={scheduleDraft.endTime} onChange={(event) => setScheduleDraft({ ...scheduleDraft, endTime: event.target.value })} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-2 text-sm" /></div>
        <input required aria-label="Class focus" value={scheduleDraft.focus} onChange={(event) => setScheduleDraft({ ...scheduleDraft, focus: event.target.value })} placeholder="Class focus" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm sm:col-span-2" />
        {editingScheduleId && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:col-span-3"><label className="flex items-center gap-2 text-sm font-bold text-amber-950"><input type="checkbox" checked={urgentChange} onChange={(event) => setUrgentChange(event.target.checked)} />Emergency / urgent change: notify affected parents immediately</label>{urgentChange && <div className="mt-2 grid gap-2 sm:grid-cols-2"><select aria-label="Emergency reason" value={urgentReason} onChange={(event) => setUrgentReason(event.target.value)} className="min-h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm"><option>Rain</option><option>Coach unavailable</option><option>Ground issue</option><option>Other</option></select>{urgentReason === 'Other' && <input required aria-label="Custom emergency reason" value={customUrgentReason} onChange={(event) => setCustomUrgentReason(event.target.value)} placeholder="Describe the reason" className="min-h-10 rounded-lg border border-amber-300 px-3 text-sm" />}</div>}</div>}
        <div className="flex gap-2"><button disabled={saving} className="min-h-11 flex-1 rounded-xl bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : editingScheduleId ? 'Save class' : 'Add class'}</button><button type="button" onClick={() => { setShowScheduleForm(false); setEditingScheduleId(''); }} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-600">Cancel</button></div>
      </form>}
      {loading ? <LoadingState /> : error ? <ErrorState title="Schedule unavailable" message={error} onRetry={() => window.location.reload()} /> : schedule.length === 0 ? <Empty>No classes are scheduled yet.</Empty> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{schedule.slice().sort((a, b) => SCHEDULE_DAYS.indexOf(a.day) - SCHEDULE_DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime)).map((slot) => <article key={slot.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-emerald-800">{slot.day} · {slot.startTime}–{slot.endTime}</p><h3 className="mt-1 text-sm font-extrabold text-slate-900">{sportName(slot.sportId)} · {slot.batch}</h3><p className="mt-1 text-xs text-slate-500">{slot.venue} · {slot.coach}</p><p className="mt-1 text-xs text-slate-600">{slot.focus}</p></div></div>{canManage && <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3"><button onClick={() => { setScheduleDraft({ day: slot.day, startTime: slot.startTime, endTime: slot.endTime, sportId: slot.sportId, batch: slot.batch, coach: slot.coach, venue: slot.venue, focus: slot.focus }); setEditingScheduleId(slot.id); setUrgentChange(false); setShowScheduleForm(true); }} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50">Edit</button><button disabled={saving} onClick={() => void deleteItem('schedule', slot.id, `${slot.batch} class`)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50">Delete</button></div>}</article>)}</div>}
      {shareUrl && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3"><p className="text-sm text-sky-900">Group messages are shared manually; individual guardian notices are queued.</p><a href={shareUrl} target="_blank" rel="noreferrer" className="min-h-10 rounded-lg bg-sky-700 px-3 py-2 text-xs font-bold text-white">Share to WhatsApp group</a></div>}
      {pendingNotification && <NotificationPreview key={`${pendingNotification.resource}-${pendingNotification.id}-${pendingNotification.eventAction}`} target={pendingNotification} onSkip={() => setPendingNotification(null)} />}
    </section>

    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><SectionTitle title="Academy events" detail="Upcoming tournaments, camps, training, and celebrations." />{canManage && <button onClick={() => { setEditingEventId(''); setEventDraft({ title: '', type: 'Tournament', date: new Date().toISOString().slice(0, 10), time: '09:00 - 12:00', venue: '', audience: '', spotsLeft: 0, description: '' }); setShowEventForm((value) => !value); }} className="min-h-10 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">{showEventForm && !editingEventId ? 'Close form' : 'Add event'}</button>}</div>
      {showEventForm && canManage && <form onSubmit={(event) => void submitEvent(event)} className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <input required aria-label="Event title" value={eventDraft.title} onChange={(event) => setEventDraft({ ...eventDraft, title: event.target.value })} placeholder="Event title" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <select aria-label="Event category" value={eventDraft.type} onChange={(event) => setEventDraft({ ...eventDraft, type: event.target.value as AcademyEvent['type'] })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option>Tournament</option><option>Trial Camp</option><option>Time Trials</option><option>Training</option><option>Sports Day</option><option>Celebration</option></select>
        <input required aria-label="Event date" type="date" min={new Date().toISOString().slice(0, 10)} value={eventDraft.date} onChange={(event) => setEventDraft({ ...eventDraft, date: event.target.value })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <input required aria-label="Event time" value={eventDraft.time} onChange={(event) => setEventDraft({ ...eventDraft, time: event.target.value })} placeholder="e.g. 09:00 - 12:00" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <input required aria-label="Event location" value={eventDraft.venue} onChange={(event) => setEventDraft({ ...eventDraft, venue: event.target.value })} placeholder="Location" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <input required aria-label="Event audience" value={eventDraft.audience} onChange={(event) => setEventDraft({ ...eventDraft, audience: event.target.value })} placeholder="Audience / eligible group" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <input required aria-label="Available event spots" type="number" min="0" step="1" value={eventDraft.spotsLeft} onChange={(event) => setEventDraft({ ...eventDraft, spotsLeft: Number(event.target.value) })} placeholder="Spots available" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <textarea required aria-label="Event description" value={eventDraft.description} onChange={(event) => setEventDraft({ ...eventDraft, description: event.target.value })} rows={2} placeholder="Event description" className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
        <div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="min-h-11 flex-1 rounded-xl bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : editingEventId ? 'Save event' : 'Create event'}</button><button type="button" onClick={() => { setShowEventForm(false); setEditingEventId(''); }} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-600">Cancel</button></div>
      </form>}
      {loading ? <LoadingState /> : error ? null : events.length === 0 ? <Empty>No upcoming events yet. Check back soon!</Empty> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{events.slice().sort((a, b) => a.date.localeCompare(b.date)).map((event) => <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{event.type}</span><time className="text-xs font-semibold text-slate-500" dateTime={event.date}>{formatDisplayDate(event.date)}</time></div><h3 className="mt-3 text-base font-extrabold text-slate-900">{event.title}</h3><p className="mt-1 text-xs text-slate-500">{event.time} · {event.venue}</p><p className="mt-2 line-clamp-3 text-sm text-slate-600">{event.description}</p><p className="mt-2 text-xs font-semibold text-slate-500">{event.audience} · {event.spotsLeft} spots available</p>{canManage && <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3"><button onClick={() => { setEventDraft({ title: event.title, type: event.type, date: event.date, time: event.time, venue: event.venue, audience: event.audience, spotsLeft: event.spotsLeft, description: event.description }); setEditingEventId(event.id); setShowEventForm(true); }} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50">Edit</button><button disabled={saving} onClick={() => void deleteItem('event', event.id, event.title)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50">Delete</button></div>}</article>)}</div>}
    </section>
  </div>;
}

function StudentDirectory({ role }: { role: UserRole }) {
  const app = useApp();
  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [sportId, setSportId] = useState<SportId>(SPORTS[0].id);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState<'ALL' | SportId>('ALL');
  const [working, setWorking] = useState(false);
  const [issuedCredentials, setIssuedCredentials] = useState<{ username: string; password: string } | null>(null);

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return app.students.filter((student) => {
      const sportIds = app.enrollments.filter((enrollment) => enrollment.studentId === student.id && enrollment.active).map((enrollment) => enrollment.sportId);
      const matchesSearch = !query || [student.firstName, student.lastName, student.parentPhone].join(' ').toLowerCase().includes(query) || (student.parentPhone || '').toLowerCase().includes(query);
      const matchesSport = sportFilter === 'ALL' || sportIds.includes(sportFilter);
      return matchesSearch && matchesSport;
    });
  }, [app.enrollments, app.students, search, sportFilter]);

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

  const updateConsent = async (studentId: string, parentName: string, optedIn: boolean) => {
    if (optedIn && !window.confirm(`Confirm that ${parentName} explicitly agreed to receive WhatsApp notifications?`)) return;
    setWorking(true);
    const result = await apiPost('/api/students/consent', { studentId, optedIn, parentConfirmed: optedIn });
    setWorking(false);
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Consent not updated', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: optedIn ? 'Guardian opted in' : 'Guardian opted out', description: `${parentName}'s notification preference was updated.` });
    await app.refreshFromServer();
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
          <input required aria-label="Student first name" autoComplete="given-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface" />
          <input required aria-label="Student last name" autoComplete="family-name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface" />
          <input required aria-label="Guardian phone" type="tel" autoComplete="tel" value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} placeholder="Guardian phone" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface" />
          <select aria-label="Student sport" value={sportId} onChange={(event) => setSportId(event.target.value as SportId)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface">
            {SPORTS.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
          </select>
          <button disabled={working} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{working ? 'Saving…' : 'Create student'}</button>
          <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600">Cancel</button>
        </form>
      )}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <input aria-label="Search students" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or guardian phone" className="min-h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm" />
          <select aria-label="Filter students by sport" value={sportFilter} onChange={(event) => setSportFilter(event.target.value === 'ALL' ? 'ALL' : event.target.value as SportId)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm">
            <option value="ALL">All sports</option>
            {SPORTS.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
          </select>
        </div>
        <p className="text-sm font-semibold text-slate-600">{visibleStudents.length} of {app.students.length} students</p>
      </div>
      {visibleStudents.length === 0 ? <Empty>No student records match this search.</Empty> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Guardian</th><th className="px-4 py-3">Sports</th><th className="px-4 py-3">Skills</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {visibleStudents.map((student) => {
                const sportIds = app.enrollments.filter((enrollment) => enrollment.studentId === student.id && enrollment.active).map((enrollment) => enrollment.sportId);
                const rating = Math.round((student.skillRatings.stamina + student.skillRatings.agility + student.skillRatings.technique + student.skillRatings.discipline) / 4);
                return <tr key={student.id}>
                  <td className="px-4 py-3"><p className="font-bold">{student.firstName} {student.lastName}</p><p className="text-xs text-slate-500">{student.studentCode}</p></td>
                  <td className="px-4 py-3">{student.parentName || 'Guardian not set'}<p className="text-xs text-slate-500">{student.parentPhone || 'No phone on file'}</p></td>
                  <td className="px-4 py-3">{sportIds.length ? sportIds.map((sportId) => sportName(sportId)).join(', ') : 'No sport'}</td>
                  <td className="px-4 py-3">{rating}/5 average</td>
                  <td className="px-4 py-3">
                    {role === 'COACH' && <div className="flex flex-wrap gap-1.5"><button onClick={() => app.updateStudentSkills(student.id, { technique: Math.min(5, student.skillRatings.technique + 1) })} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50">Improve technique</button><button disabled={working} onClick={() => void updateConsent(student.id, student.parentName, !student.parentMessagingConsentAt)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50">{student.parentMessagingConsentAt ? 'Revoke WhatsApp opt-in' : 'Record WhatsApp opt-in'}</button></div>}
                    {role === 'ADMIN' && <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => app.archiveStudent(student.id, 'Transferred')} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50">Archive</button>
                      <button disabled={working} onClick={() => void updateConsent(student.id, student.parentName, !student.parentMessagingConsentAt)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50">{student.parentMessagingConsentAt ? 'Revoke WhatsApp opt-in' : 'Record WhatsApp opt-in'}</button>
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
      <AchievementManager role={role} />
    </section>
  );
}

function AchievementManager({ role }: { role: UserRole }) {
  const app = useApp();
  const canManage = role === 'ADMIN' || role === 'COACH';
  const [studentId, setStudentId] = useState(app.students[0]?.id ?? '');
  const [editingId, setEditingId] = useState('');
  const [working, setWorking] = useState(false);
  const [pendingNotification, setPendingNotification] = useState<NotificationPreviewTarget | null>(null);
  const [draft, setDraft] = useState<Omit<Achievement, 'id' | 'studentId' | 'coachName'>>({
    title: '', sport: app.mySports[0] ?? 'badminton', category: 'Milestone', description: '',
    awardedDate: new Date().toISOString().slice(0, 10), photoUrl: '',
  });
  useEffect(() => {
    if (app.students.length && !app.students.some((student) => student.id === studentId)) setStudentId(app.students[0].id);
  }, [app.students, studentId]);
  const achievements = app.students.flatMap((student) => student.achievements.map((achievement) => ({ student, achievement })))
    .sort((a, b) => b.achievement.awardedDate.localeCompare(a.achievement.awardedDate));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!studentId) return;
    const wasEditing = Boolean(editingId);
    setWorking(true);
    const body = { ...draft, studentId, photoUrl: draft.photoUrl || undefined };
    const result = editingId
      ? await apiPut<{ achievement: Achievement }>('/api/achievements', { ...body, id: editingId })
      : await apiPost<{ achievement: Achievement }>('/api/achievements', body);
    setWorking(false);
    if (!result.ok || !result.data) {
      app.addToast({ type: 'error', title: 'Achievement not saved', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: editingId ? 'Achievement updated' : 'Achievement added', description: `${draft.title} · ${app.students.find((student) => student.id === studentId)?.firstName ?? 'Student'}` });
    if (!wasEditing) {
      const studentName = app.students.find((student) => student.id === studentId)?.firstName ?? 'Athlete';
      setPendingNotification({
        resource: 'achievement', id: result.data.achievement.id, title: result.data.achievement.title,
        message: `Congratulations ${studentName}! You earned ${result.data.achievement.title} in ${sportName(result.data.achievement.sport)} on ${result.data.achievement.awardedDate}. ${result.data.achievement.description}`,
      });
    }
    setEditingId('');
    setDraft({ title: '', sport: app.mySports[0] ?? 'badminton', category: 'Milestone', description: '', awardedDate: new Date().toISOString().slice(0, 10), photoUrl: '' });
    await app.refreshFromServer();
  };

  const remove = async (achievement: Achievement, studentName: string) => {
    if (!window.confirm(`Delete "${achievement.title}" for ${studentName}? This cannot be undone.`)) return;
    setWorking(true);
    const result = await apiRequest('/api/achievements', { method: 'DELETE', body: JSON.stringify({ id: achievement.id }) });
    setWorking(false);
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Achievement not deleted', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: 'Achievement deleted', description: achievement.title });
    await app.refreshFromServer();
  };

  return <section className="mt-8 border-t border-slate-200 pt-6">
    <SectionTitle title="Achievements" detail="Milestones attached to each athlete's profile." />
    {canManage && <form onSubmit={(event) => void submit(event)} className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <select required aria-label="Achievement student" value={studentId} onChange={(event) => setStudentId(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">Choose student</option>{app.students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}</select>
      <input required aria-label="Achievement title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Achievement title" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
      <select aria-label="Achievement sport" value={draft.sport} onChange={(event) => setDraft({ ...draft, sport: event.target.value as SportId })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm">{SPORTS.filter((sport) => !app.mySports.length || app.mySports.includes(sport.id)).map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select>
      <select aria-label="Achievement category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Achievement['category'] })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option>Tournament</option><option>Skill Badge</option><option>Milestone</option><option>Personal Best</option></select>
      <input required aria-label="Achievement date" type="date" value={draft.awardedDate} onChange={(event) => setDraft({ ...draft, awardedDate: event.target.value })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
      <select aria-label="Achievement medal" value={draft.medalType ?? ''} onChange={(event) => setDraft({ ...draft, medalType: event.target.value as Achievement['medalType'] || undefined })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">No medal</option><option>Gold</option><option>Silver</option><option>Bronze</option><option>Badge</option><option>Trophy</option></select>
      <select aria-label="Achievement gallery photo" value={(draft.photoUrl ?? '').startsWith('/api/media/file/') ? draft.photoUrl : ''} onChange={(event) => setDraft({ ...draft, photoUrl: event.target.value || undefined })} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">No gallery photo</option>{app.media.filter((item) => item.isApproved).map((item) => <option key={item.id} value={item.mediaUrl}>{item.title}</option>)}</select>
      <input aria-label="Achievement photo URL" type="url" value={(draft.photoUrl ?? '').startsWith('/api/media/file/') ? '' : draft.photoUrl ?? ''} onChange={(event) => setDraft({ ...draft, photoUrl: event.target.value || undefined })} placeholder="Or enter an external https:// photo URL" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
      <textarea required aria-label="Achievement description" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" rows={2} className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <button disabled={working || !studentId} className="min-h-11 rounded-xl bg-emerald-700 px-3 text-sm font-bold text-white disabled:opacity-50">{working ? 'Saving…' : editingId ? 'Save achievement' : 'Add achievement'}</button>
      {editingId && <button type="button" onClick={() => { setEditingId(''); setDraft({ title: '', sport: app.mySports[0] ?? 'badminton', category: 'Milestone', description: '', awardedDate: new Date().toISOString().slice(0, 10), photoUrl: '' }); }} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-600">Cancel edit</button>}
    </form>}
    {pendingNotification && <NotificationPreview key={pendingNotification.id} target={pendingNotification} onSkip={() => setPendingNotification(null)} />}
    {achievements.length === 0 ? <Empty>No achievements have been recorded yet.</Empty> : <div className="grid gap-3 sm:grid-cols-2">{achievements.map(({ student, achievement }) => <article key={achievement.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">{achievement.photoUrl ? <img src={achievement.photoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><Trophy className="h-5 w-5" /></span>}<div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{achievement.title}</p><p className="mt-0.5 text-xs text-slate-500">{student.firstName} {student.lastName} · {sportName(achievement.sport)} · {achievement.category}</p><p className="mt-1 text-sm text-slate-600">{achievement.description}</p><p className="mt-1 text-xs text-slate-400">{formatDisplayDate(achievement.awardedDate)}{achievement.medalType ? ` · ${achievement.medalType}` : ''}</p>{canManage && <div className="mt-2 flex gap-2"><button onClick={() => { setStudentId(student.id); setEditingId(achievement.id); setDraft({ title: achievement.title, sport: achievement.sport, category: achievement.category, description: achievement.description, awardedDate: achievement.awardedDate, medalType: achievement.medalType, photoUrl: achievement.photoUrl }); }} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">Edit</button><button disabled={working} onClick={() => void remove(achievement, `${student.firstName} ${student.lastName}`)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50">Delete</button></div>}</div></article>)}</div>}
  </section>;
}

function AttendancePanel({ role, selectedDate, setSelectedDate, selectedSport, setSelectedSport, records }: {
  role: UserRole; selectedDate: string; setSelectedDate: (value: string) => void; selectedSport: SportId; setSelectedSport: (value: SportId) => void; records: ReturnType<ReturnType<typeof useApp>['attendanceForDate']>;
}) {
  const app = useApp();
  const sportOptions = role === 'ADMIN' ? SPORTS : SPORTS.filter((sport) => app.mySports.includes(sport.id));
  const students = app.studentsForSport(selectedSport);
  const [pending, setPending] = useState<Record<string, 'present' | 'absent'>>({});
  const [saving, setSaving] = useState(false);
  const canMark = role === 'ADMIN' || role === 'COACH';
  const mark = async () => {
    if (saving) return;
    setSaving(true);
    const entries = students.map((student) => ({
      studentId: student.id,
      status: pending[student.id] ?? records.find((item) => item.studentId === student.id)?.status ?? 'present',
    }));
    try {
      const result = await app.markAttendance(selectedDate, selectedSport, entries);
      app.addToast({ type: result.success ? 'success' : 'error', title: result.success ? 'Attendance saved' : 'Attendance not saved', description: result.message });
      if (result.success) setPending({});
    } catch (error) {
      app.addToast({ type: 'error', title: 'Attendance not saved', description: error instanceof Error ? error.message : 'Could not save the attendance sheet.' });
    } finally {
      setSaving(false);
    }
  };
  return (
    <section>
      <SectionTitle title="Attendance" detail="Attendance changes are written through the authenticated server API." />
      <div className="mb-4 flex flex-wrap gap-2">
        <input aria-label="Attendance date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-line dark:bg-surface" />
        <select aria-label="Attendance sport" value={selectedSport} onChange={(event) => setSelectedSport(event.target.value as SportId)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-line dark:bg-surface">
          {sportOptions.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        {canMark && <button disabled={saving || students.length === 0} onClick={() => void mark()} className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900">{saving ? 'Saving…' : 'Save sheet'}</button>}
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
      {app.facilities.length === 0 ? <Empty>No facilities are available to book.</Empty> : <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-line dark:bg-surface">
        <select aria-label="Facility" value={facilityId} onChange={(event) => setFacilityId(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface">{app.facilities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <input aria-label="Booking date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface" />
        <div className="flex gap-2"><input aria-label="Start time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-2 text-sm dark:border-line dark:bg-surface" /><input aria-label="End time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-2 text-sm dark:border-line dark:bg-surface" /></div>
        <button onClick={book} className="min-h-11 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">Reserve slot</button>
      </div>}
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
      {role === 'ADMIN' && <div className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-line dark:bg-surface"><select aria-label="Invoice student" value={invoiceStudent} onChange={(event) => setInvoiceStudent(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface">{app.students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName}</option>)}</select><input aria-label="Invoice amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="Amount" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface" /><input aria-label="Billing period" value={period} onChange={(event) => setPeriod(event.target.value)} placeholder="Billing period" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm dark:border-line dark:bg-surface" /><button disabled={app.students.length === 0} onClick={generate} className="min-h-11 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900">Create invoice</button></div>}
      {visibleInvoices.length === 0 ? <Empty>No invoices are visible.</Empty> : <div className="space-y-2">{visibleInvoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><FileText className="h-5 w-5 text-slate-400" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{invoice.invoiceNumber} · {invoice.studentName}</p><p className="text-xs text-slate-500">{invoice.period} · Due {invoice.dueDate} · ${invoice.amount.toLocaleString()}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{invoice.status}</span>{invoice.status !== 'PAID' && role === 'STUDENT' && <button onClick={() => void app.payInvoice(invoice.id)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Pay online</button>}{invoice.status !== 'PAID' && role === 'ADMIN' && <button onClick={() => void app.sendWhatsAppPaymentReminder(invoice.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Send reminder</button>}</div>)}</div>}
      {role === 'ADMIN' && <div className="mt-8"><SectionTitle title="Payroll" detail="Coach check-ins are excluded until location verification is configured." />{app.payroll.length === 0 ? <Empty>No payroll records are available.</Empty> : app.payroll.map((item) => <div key={item.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex-1"><p className="text-sm font-bold">{item.coachName} · {item.month}</p><p className="text-xs text-slate-500">{item.verifiedSessions} verified sessions · ${item.totalDisbursed.toLocaleString()}</p></div><span className="text-xs font-bold">{item.status}</span>{item.status === 'PENDING' && <button onClick={() => app.markPayrollDisbursed(item.id)} className="min-h-10 rounded-xl border border-slate-300 px-3 text-xs font-bold dark:border-line">Mark disbursed</button>}</div>)}</div>}
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
      <div className="space-y-2">{app.coachAttendance.length === 0 ? <Empty>No shift records are available yet.</Empty> : app.coachAttendance.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"><Clock3 className="h-4 w-4 text-slate-400" /><div className="flex-1"><p className="text-sm font-bold">{item.coachName}</p><p className="text-xs text-slate-500">{item.date} · {item.checkInTime}{item.checkOutTime ? `–${item.checkOutTime}` : ''}</p></div><span className="text-[11px] font-bold text-amber-800">{item.isVerifiedForPayroll ? 'Verified' : 'Unverified'}</span></div>)}</div>
      {role === 'ADMIN' && <form onSubmit={(event) => void createCoachAccount(event)} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <h3 className="text-sm font-extrabold sm:col-span-2">Create coach account</h3>
        <label className="space-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">Full name<input required autoComplete="name" value={newCoachName} onChange={(event) => setNewCoachName(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal dark:border-line dark:bg-surface" /></label>
        <label className="space-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">Email / login ID<input required type="email" autoComplete="email" value={newCoachEmail} onChange={(event) => setNewCoachEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal dark:border-line dark:bg-surface" /></label>
        <label className="space-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">Phone<input required type="tel" autoComplete="tel" placeholder="+15550192831" value={newCoachPhone} onChange={(event) => setNewCoachPhone(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal dark:border-line dark:bg-surface" /></label>
        <label className="space-y-1 text-xs font-bold text-slate-600 dark:text-slate-300">Certification<input required value={newCoachCertification} onChange={(event) => setNewCoachCertification(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal dark:border-line dark:bg-surface" /></label>
        <fieldset className="rounded-xl border border-slate-200 p-3 sm:col-span-2 dark:border-line">
          <legend className="px-1 text-xs font-bold text-slate-600 dark:text-slate-300">Assigned sports</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SPORTS.map((item) => (
              <label key={item.id} className="flex min-h-10 items-center gap-2 rounded-lg bg-slate-50 px-3 text-xs font-semibold dark:bg-surface-2">
                <input type="checkbox" checked={newCoachSportIds.includes(item.id)} onChange={(event) => setNewCoachSportIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
                {item.name}
              </label>
            ))}
          </div>
          {newCoachSportIds.length === 0 && <p className="mt-2 text-xs text-slate-500">Choose at least one sport to enable coach access.</p>}
        </fieldset>
        <button disabled={creatingCoach || newCoachSportIds.length === 0} className="min-h-11 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 sm:col-span-2">{creatingCoach ? 'Creating…' : 'Create coach login'}</button>
        {newCoachCredentials && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-500/15 dark:text-amber-100 sm:col-span-2">One-time credentials — ID: <strong>{newCoachCredentials.username}</strong> · password: <strong>{newCoachCredentials.password}</strong>. Save securely now.</p>}
      </form>}
      {role === 'ADMIN' && <div className="mt-4 space-y-2">{app.coaches.length === 0 ? <Empty>No coach profiles have been added yet.</Empty> : app.coaches.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-slate-500">{item.certification} · {item.isCheckedInToday ? 'On shift' : 'Off shift'}</p><p className="mt-1 text-xs text-slate-400">{app.coachAssignments.filter((assignment) => assignment.coachId === item.id).map((assignment) => SPORTS.find((sport) => sport.id === assignment.sportId)?.name).filter(Boolean).join(', ')}</p></div>)}</div>}
    </section>
  );
}

function CommunicationsPanel({ role }: { role: UserRole }) {
  const app = useApp();
  const [message, setMessage] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [announcementAudience, setAnnouncementAudience] = useState<'ALL' | 'COACH' | 'STUDENT'>('ALL');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState('');
  const [announcementPinned, setAnnouncementPinned] = useState(false);
  const [announcementSport, setAnnouncementSport] = useState('');
  const [announcementWorking, setAnnouncementWorking] = useState(false);
  const [pendingAnnouncementNotification, setPendingAnnouncementNotification] = useState<NotificationPreviewTarget | null>(null);
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
    setAnnouncementWorking(true);
    const payload = { title: announcementTitle.trim(), body: announcementBody.trim(), audience: announcementAudience, pinned: announcementPinned, sportId: announcementSport || undefined };
    const wasEditing = Boolean(editingAnnouncementId);
    const result = editingAnnouncementId
      ? await apiPut<{ announcement: Announcement }>('/api/announcements', { ...payload, id: editingAnnouncementId })
      : await apiPost<{ announcement: Announcement }>('/api/announcements', payload);
    setAnnouncementWorking(false);
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Announcement not saved', description: result.message });
      return;
    }
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setAnnouncementSport('');
    setAnnouncementPinned(false);
    setEditingAnnouncementId('');
    app.addToast({ type: 'success', title: editingAnnouncementId ? 'Announcement updated' : 'Announcement published', description: 'It is now available to the selected audience.' });
    if (!wasEditing && result.data.announcement) {
      setPendingAnnouncementNotification({
        resource: 'announcement', id: result.data.announcement.id, title: result.data.announcement.title,
        message: `Vendhan Sports Academy announcement: ${result.data.announcement.title}. ${result.data.announcement.body}`,
      });
    }
    await app.refreshFromServer();
  };
  const removeAnnouncement = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setAnnouncementWorking(true);
    const result = await apiRequest('/api/announcements', { method: 'DELETE', body: JSON.stringify({ id }) });
    setAnnouncementWorking(false);
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Announcement not deleted', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: 'Announcement deleted', description: title });
    await app.refreshFromServer();
  };
  return (
    <section>
      <SectionTitle title="Communications" detail="Academy announcements and message outbox." />
      {(role === 'ADMIN' || role === 'COACH') && <form onSubmit={(event) => { event.preventDefault(); void publishAnnouncement(); }} className="mb-5 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"><p className="text-sm font-bold sm:col-span-2">{editingAnnouncementId ? 'Edit announcement' : 'Publish an in-app announcement'}</p><input required aria-label="Announcement title" value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} placeholder="Announcement title" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" /><select aria-label="Announcement audience" value={announcementAudience} onChange={(event) => setAnnouncementAudience(event.target.value as typeof announcementAudience)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="ALL">Everyone</option><option value="COACH">Coaches</option><option value="STUDENT">Students</option></select><select aria-label="Announcement sport filter" value={announcementSport} onChange={(event) => setAnnouncementSport(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option value="">All sports</option>{SPORTS.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select><label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm"><input type="checkbox" checked={announcementPinned} onChange={(event) => setAnnouncementPinned(event.target.checked)} /> Pin announcement</label><textarea required aria-label="Announcement body" value={announcementBody} onChange={(event) => setAnnouncementBody(event.target.value)} rows={2} placeholder="Announcement text" className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2" /><div className="flex gap-2 sm:col-span-2"><button disabled={announcementWorking} className="min-h-11 flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{announcementWorking ? 'Saving…' : editingAnnouncementId ? 'Save announcement' : 'Publish'}</button>{editingAnnouncementId && <button type="button" onClick={() => { setEditingAnnouncementId(''); setAnnouncementTitle(''); setAnnouncementBody(''); setAnnouncementSport(''); setAnnouncementPinned(false); }} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-600">Cancel edit</button>}</div></form>}
      {role === 'ADMIN' && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="mb-2 text-sm font-bold text-amber-950">Send to explicitly opted-in guardians</p><div className="mb-2 grid gap-2 sm:grid-cols-2"><select value={targetType} onChange={(event) => setTargetType(event.target.value as typeof targetType)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"><option value="ALL_PARENTS">All opted-in guardians</option><option value="SPORT">By sport</option><option value="BATCH">By batch</option></select>{targetType === 'SPORT' ? <select value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"><option value="">Choose sport</option>{SPORTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : targetType === 'BATCH' ? <select value={targetValue} onChange={(event) => setTargetValue(event.target.value)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"><option value="">Choose batch</option>{Array.from(new Set(app.students.map((item) => item.batchShift))).map((batch) => <option key={batch} value={batch}>{batch}</option>)}</select> : null}</div><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={1000} rows={3} placeholder="Write the message…" className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" /><button disabled={sending || (targetType !== 'ALL_PARENTS' && !targetValue)} onClick={() => void send()} className="mt-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send broadcast'}</button><p className="mt-2 text-xs text-amber-900">Only guardians with a recorded opt-in and a valid phone are contacted. Provider acceptance is recorded; actual delivery receipts require provider webhooks.</p></div>}
      <div className="space-y-2">{app.announcements.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold">{item.title}</p>{item.pinned && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Pinned</span>}</div><p className="mt-1 text-sm text-slate-600">{item.body}</p><p className="mt-2 text-xs text-slate-400">{item.authorName} · {item.createdAt}</p>{(role === 'ADMIN' || role === 'COACH') && <div className="mt-3 flex justify-end gap-2"><button onClick={() => { setEditingAnnouncementId(item.id); setAnnouncementTitle(item.title); setAnnouncementBody(item.body); setAnnouncementAudience(item.audience === 'ADMIN' ? 'ALL' : item.audience); setAnnouncementSport(item.sportId ?? ''); setAnnouncementPinned(Boolean(item.pinned)); }} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">Edit</button><button disabled={announcementWorking} onClick={() => void removeAnnouncement(item.id, item.title)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50">Delete</button></div>}</article>)}</div>
      {app.broadcasts.length > 0 && <div className="mt-5 space-y-2">{app.broadcasts.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-sm font-bold"><Megaphone className="h-4 w-4" />{item.templateTitle}<span className="ml-auto text-xs font-bold text-amber-700">{item.deliveryStatus}</span></div><p className="mt-2 text-sm text-slate-600">{item.messageContent}</p><p className="mt-2 text-xs text-slate-400">{item.deliveredCount}/{item.recipientCount} delivered · {new Date(item.sentAt).toLocaleString()}</p></div>)}</div>}
      {app.announcements.length === 0 && app.broadcasts.length === 0 && <Empty>No updates are available.</Empty>}
      {pendingAnnouncementNotification && <NotificationPreview key={pendingAnnouncementNotification.id} target={pendingAnnouncementNotification} onSkip={() => setPendingAnnouncementNotification(null)} />}
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
  const [sport, setSport] = useState<SportId>(app.mySports[0] ?? 'badminton');
  const [category, setCategory] = useState<MediaItem['category']>('Training');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [editingId, setEditingId] = useState('');
  const [working, setWorking] = useState(false);
  const canManage = role === 'ADMIN' || role === 'COACH';
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const selectFiles = (selection: FileList | null) => {
    const selected = Array.from(selection ?? []);
    if (selected.length > 10) {
      app.addToast({ type: 'error', title: 'Too many photos', description: 'Upload 10 photos or fewer at a time.' });
      return;
    }
    const invalid = selected.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      app.addToast({ type: 'error', title: 'Photo not accepted', description: 'Choose JPG, PNG, or WebP photos no larger than 5 MB each.' });
      return;
    }
    if (editingId && selected.length > 1) {
      app.addToast({ type: 'error', title: 'Choose one replacement', description: 'Replace one photo at a time.' });
      return;
    }
    setFiles(selected);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingId && files.length === 0) {
      app.addToast({ type: 'error', title: 'Choose photos', description: 'Select at least one photo before uploading.' });
      return;
    }
    const form = new FormData();
    form.set('title', title.trim());
    form.set('sport', sport);
    form.set('category', category);
    if (editingId) form.set('id', editingId);
    files.forEach((file) => form.append('files', file));
    setWorking(true);
    const result = await apiRequest<{ media?: MediaItem[]; mediaItem?: MediaItem }>(
      '/api/media',
      { method: editingId ? 'PUT' : 'POST', body: form }
    );
    setWorking(false);
    if (!result.ok || !result.data) {
      app.addToast({ type: 'error', title: 'Photos not saved', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: editingId ? 'Photo updated' : 'Photos uploaded', description: editingId ? 'The gallery item was updated.' : `${result.data.media?.length ?? 0} photo(s) resized and added.` });
    setTitle('');
    setFiles([]);
    setEditingId('');
    await app.refreshFromServer();
  };

  const remove = async (item: MediaItem) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setWorking(true);
    const result = await apiRequest('/api/media', { method: 'DELETE', body: JSON.stringify({ id: item.id }) });
    setWorking(false);
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Photo not deleted', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: 'Photo deleted', description: item.title });
    await app.refreshFromServer();
  };
  const changeApproval = async (item: MediaItem) => {
    setWorking(true);
    const result = await apiRequest('/api/media', { method: 'PATCH', body: JSON.stringify({ id: item.id, isApproved: !item.isApproved }) });
    setWorking(false);
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Photo visibility not updated', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: item.isApproved ? 'Photo unpublished' : 'Photo approved', description: item.title });
    await app.refreshFromServer();
  };
  return (
    <section>
      <SectionTitle title="Academy media" detail="Upload JPG, PNG, or WebP photos. Each file is resized on the server and limited to 5 MB." />
      {canManage && <form onSubmit={(event) => void submit(event)} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <input aria-label="Photo title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Photo title (optional for multiple files)" className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm" />
        <select aria-label="Photo sport" value={sport} onChange={(event) => setSport(event.target.value as SportId)} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm">{SPORTS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select aria-label="Photo category" value={category} onChange={(event) => setCategory(event.target.value as MediaItem['category'])} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm"><option>Match</option><option>Training</option><option>Award Ceremony</option><option>Clinic</option></select>
        <input aria-label="Select photos" type="file" accept="image/jpeg,image/png,image/webp" multiple={!editingId} onChange={(event) => selectFiles(event.target.files)} className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-bold" />
        {previews.length > 0 && <div aria-label="Selected photo previews" className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-4">{previews.map((preview, index) => <figure key={preview} className="overflow-hidden rounded-lg border border-slate-200"><img src={preview} alt={`Selected upload preview ${index + 1}`} className="aspect-[4/3] w-full object-cover" /><figcaption className="truncate px-2 py-1 text-[11px] text-slate-500">{files[index]?.name}</figcaption></figure>)}</div>}
        <div className="flex gap-2 sm:col-span-2"><button disabled={working} className="min-h-11 flex-1 rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{working ? 'Processing photos…' : editingId ? 'Save / replace photo' : 'Upload photos'}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setTitle(''); setFiles([]); }} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-600">Cancel edit</button>}</div>
      </form>}
      {app.media.length === 0 ? <Empty>No approved or submitted media is available.</Empty> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{app.media.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><img src={item.thumbnailUrl} alt={item.title} className="h-40 w-full object-cover" /><div className="p-3"><p className="text-sm font-bold">{item.title}</p><p className="text-xs text-slate-500">{sportName(item.sport)} · {item.category} · {item.isApproved ? 'Published' : 'Awaiting approval'}</p>{canManage && <div className="mt-2 flex flex-wrap gap-2"><button onClick={() => { setEditingId(item.id); setTitle(item.title); setSport(item.sport); setCategory(item.category); setFiles([]); }} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold">Edit / replace</button><button disabled={working} onClick={() => void remove(item)} className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 disabled:opacity-50">Delete</button>{role === 'ADMIN' && <button disabled={working} onClick={() => void changeApproval(item)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold disabled:opacity-50">{item.isApproved ? 'Unpublish' : 'Approve'}</button>}</div>}</div></article>)}</div>}
    </section>
  );
}

interface NotificationHistoryItem {
  id: string;
  recipient: string;
  studentName?: string;
  type: string;
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error?: string;
  timestamp: string;
  attempts: number;
}

function NotificationHistoryPanel() {
  const app = useApp();
  const [items, setItems] = useState<NotificationHistoryItem[]>([]);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Hello from Vendhan Sports Academy');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const result = await apiGet<{ notifications: NotificationHistoryItem[] }>('/api/notifications');
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message || 'Could not load notification history.');
      return;
    }
    setError('');
    setItems(result.data.notifications);
  };

  useEffect(() => { void load(); }, []);

  const sendTest = async (event: FormEvent) => {
    event.preventDefault();
    setWorking(true);
    setFormFeedback(null);
    const result = await apiPost('/api/notifications', { action: 'test', phone, message });
    setWorking(false);
    if (!result.ok) {
      const feedback = result.message || 'The test message could not be sent.';
      setFormFeedback({ type: 'error', text: feedback });
      app.addToast({ type: 'error', title: 'Test message not queued', description: feedback });
      return;
    }
    const feedback = 'Test message queued. Delivery status will update from Meta as the webhook reports back.';
    setFormFeedback({ type: 'success', text: feedback });
    app.addToast({ type: 'success', title: 'Test message queued', description: feedback });
    setPhone('');
    setMessage('Hello from Vendhan Sports Academy');
    await load();
  };

  const resend = async (id: string) => {
    setWorking(true);
    const result = await apiPost('/api/notifications', { action: 'resend', id });
    setWorking(false);
    if (!result.ok) {
      app.addToast({ type: 'error', title: 'Message not queued', description: result.message });
      return;
    }
    app.addToast({ type: 'success', title: 'Message queued for retry' });
    await load();
  };

  const statusTone: Record<NotificationHistoryItem['status'], string> = {
    queued: 'bg-amber-50 text-amber-800',
    sent: 'bg-sky-50 text-sky-800',
    delivered: 'bg-emerald-50 text-emerald-800',
    read: 'bg-violet-50 text-violet-800',
    failed: 'bg-rose-50 text-rose-800',
  };

  return <section>
    <SectionTitle title="WhatsApp notification history" detail="Provider updates and retryable delivery failures." />
    <form onSubmit={(event) => void sendTest(event)} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="text-xs font-bold text-slate-600">Phone number<input required type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+919876543210" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal" /></label>
      <label className="text-xs font-bold text-slate-600">Message<textarea value={message} maxLength={1000} onChange={(event) => setMessage(event.target.value)} placeholder="Hello from Vendhan Sports Academy" className="mt-1 min-h-[92px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
      <div className="flex items-center justify-between gap-3">
        <button disabled={working} className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50">{working ? 'Queueing…' : 'Send test message'}</button>
        <span className="text-[11px] text-slate-500">{message.length}/1000</span>
      </div>
      {formFeedback && <p className={formFeedback.type === 'success' ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'}>{formFeedback.text}</p>}
    </form>
    {error && <div className="mb-4"><ErrorState title="History unavailable" message={error} onRetry={() => void load()} /></div>}
    {loading ? <LoadingState /> : items.length === 0 ? <Empty>No WhatsApp notifications have been queued yet.</Empty> : <div className="space-y-2">{items.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusTone[item.status]}`}>{item.status}</span><span className="text-xs font-bold text-slate-700">{item.type.replaceAll('_', ' ')}</span><span className="ml-auto text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</span></div><p className="mt-2 text-sm font-semibold text-slate-800">{item.studentName ? `${item.studentName} · ` : ''}{item.recipient}</p><p className="mt-1 text-xs text-slate-500">Attempts: {item.attempts}</p>{item.error && <p className="mt-2 text-xs text-rose-700">{item.error}</p>}{item.status === 'failed' && <button disabled={working} onClick={() => void resend(item.id)} className="mt-3 min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 disabled:opacity-50">Resend</button>}</article>)}</div>}
  </section>;
}

function ArchivePanel() {
  const app = useApp();
  return <section><SectionTitle title="Student archive" detail="Archived records can be restored by an administrator." />{app.archivedStudents.length === 0 ? <Empty>No archived students.</Empty> : app.archivedStudents.map((item) => <div key={item.id} className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><Archive className="h-4 w-4 text-amber-600" /><div className="flex-1"><p className="text-sm font-bold">{item.fullName} · {item.studentCode}</p><p className="text-xs text-slate-500">{item.archivalReason} · {item.archivedAt}</p></div><button onClick={() => app.restoreArchivedStudent(item.id)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Restore</button></div>)}</section>;
}

function ReportsPanel() {
  const [data, setData] = useState<{
    totals: {
      students: number;
      coaches: number;
      enrollments: number;
      sessions: number;
      records: number;
      presentToday: number;
      absentToday: number;
    };
    bySport: Array<{
      sportId: string;
      sportName: string;
      total: number;
      present: number;
      absent: number;
      percentage: number;
      students: number;
    }>;
    byStudent: Array<{
      studentId: string;
      studentCode: string;
      name: string;
      total: number;
      present: number;
      absent: number;
      percentage: number;
    }>;
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGet<{ reports: NonNullable<typeof data> }>('/api/reports')
      .then((result) => {
        if (cancelled) return;
        if (result.ok && result.data) {
          setData(result.data.reports);
        } else {
          setError(result.message);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the reports.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => setAttempt((value) => value + 1);

  if (loading) {
    return (
      <section>
        <SectionTitle title="Reports" detail="Academy-wide attendance aggregates." />
        <LoadingState label="Loading academy reports…" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section>
        <SectionTitle title="Reports" detail="Academy-wide attendance aggregates." />
        <ErrorState title="Reports unavailable" message={error || 'The reports could not be loaded.'} onRetry={retry} />
      </section>
    );
  }

  const cards = [
    { label: 'Active students', value: data.totals.students, Icon: Users },
    { label: 'Coaches', value: data.totals.coaches, Icon: UserRoundCheck },
    { label: 'Enrolments', value: data.totals.enrollments, Icon: ClipboardCheck },
    { label: 'Attendance records', value: data.totals.records, Icon: CalendarDays },
  ];

  return (
    <section className="space-y-6">
      <div>
        <SectionTitle
          title="Reports"
          detail="Live aggregates computed on the server. Only administrators can read them."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                {label}
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title="Attendance by sport" detail="Present share of every marked session." />
        {data.bySport.length === 0 ? <Empty>No attendance has been recorded by sport yet.</Empty> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 dark:border-line dark:bg-surface">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th scope="col" className="py-2 pr-3 font-bold">Sport</th>
                <th scope="col" className="py-2 pr-3 font-bold">Students</th>
                <th scope="col" className="py-2 pr-3 font-bold">Sessions</th>
                <th scope="col" className="py-2 pr-3 font-bold">Present</th>
                <th scope="col" className="py-2 font-bold">Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.bySport.map((row) => (
                <tr key={row.sportId} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="py-3 pr-3 text-sm font-bold text-slate-900">{row.sportName}</th>
                  <td className="py-3 pr-3 text-sm text-slate-600">{row.students}</td>
                  <td className="py-3 pr-3 text-sm text-slate-600">{row.total}</td>
                  <td className="py-3 pr-3 text-sm text-slate-600">{row.present}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.percentage}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{row.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </div>

      <div>
        <SectionTitle title="Attendance by student" detail="Sorted by the weakest attendance first." />
        {data.byStudent.length === 0 ? (
          <Empty>No attendance has been recorded yet.</Empty>
        ) : (
          <div className="space-y-2">
            {[...data.byStudent]
              .sort((a, b) => a.percentage - b.percentage)
              .map((row) => (
                <div
                  key={row.studentId}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.studentCode} · {row.present} present · {row.absent} absent
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      row.percentage >= 80
                        ? 'bg-emerald-50 text-emerald-700'
                        : row.percentage >= 60
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {row.percentage}%
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
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
