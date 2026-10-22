'use client';

import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, User, Zap, ListChecks, Sun } from 'lucide-react';
import {
  SCHEDULE_DAYS,
  ScheduleDay,
  ScheduleSlot,
  WEEK_SCHEDULE,
} from '@/data/publicSiteData';
import { getSport } from '@/lib/sports';
import { SportIcon } from '@/components/app/SportIcon';

function SlotRow({ slot }: { slot: ScheduleSlot }) {
  const sport = getSport(slot.sportId);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-5">
      <div className="flex items-center gap-3 sm:w-32 sm:shrink-0">
        <span className={`h-9 w-1.5 rounded-full ${sport.accent.bg}`} />
        <div>
          <p className="text-sm font-extrabold text-slate-900">{slot.startTime}</p>
          <p className="text-[11px] font-semibold text-slate-400">to {slot.endTime}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${sport.accent.soft} ${sport.accent.text}`}
          >
            <SportIcon sportId={slot.sportId} className="h-3.5 w-3.5" />
            {sport.name}
          </span>
          <p className="text-xs font-bold text-slate-700">{slot.batch}</p>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{slot.focus}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-500 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1">
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          Coach {slot.coach}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {slot.venue}
        </span>
      </div>
    </li>
  );
}

export const ScheduleSection: React.FC = () => {
  const [view, setView] = useState<'DAY' | 'WEEK'>('DAY');
  const [today, setToday] = useState<ScheduleDay | null>(null);

  // Resolved after mount so the server and client never disagree on the date.
  useEffect(() => {
    const jsDay = new Date().getDay();
    setToday(SCHEDULE_DAYS[(jsDay + 6) % 7]);
  }, []);

  const todaySlots = today ? WEEK_SCHEDULE.filter((slot) => slot.day === today) : [];

  return (
    <section id="schedule" className="scroll-mt-20 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-700">
              <CalendarDays className="h-3 w-3" />
              Timetable
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Schedule
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Check what is running today, or plan the whole week ahead. Every slot below is
              a live batch with a confirmed coach.
            </p>
          </div>

          {/* View toggle */}
          <div className="inline-flex w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm md:w-auto">
            <button
              onClick={() => setView('DAY')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all md:flex-none ${
                view === 'DAY'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Sun className="h-4 w-4" />
              Schedule of the Day
            </button>
            <button
              onClick={() => setView('WEEK')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all md:flex-none ${
                view === 'WEEK'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <ListChecks className="h-4 w-4" />
              Schedule of the Week
            </button>
          </div>
        </div>

        {view === 'DAY' ? (
          <div className="mt-9">
            <div className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 font-extrabold text-slate-950">
                <Clock className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  {today ? `Today · ${today}` : 'Today'}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  {todaySlots.length} session{todaySlots.length === 1 ? '' : 's'} scheduled
                </p>
              </div>
            </div>

            {today === null ? (
              <ul className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="h-[76px] animate-pulse rounded-2xl border border-slate-200 bg-white"
                  />
                ))}
              </ul>
            ) : todaySlots.length > 0 ? (
              <ul className="space-y-3">
                {todaySlots.map((slot) => (
                  <SlotRow key={slot.id} slot={slot} />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-bold text-slate-700">No sessions scheduled today.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Switch to the weekly view to see the full timetable.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-9 space-y-8">
            {SCHEDULE_DAYS.map((day) => {
              const slots = WEEK_SCHEDULE.filter((slot) => slot.day === day);
              const isToday = today === day;
              return (
                <div key={day}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold ${
                        isToday
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {day}
                        {isToday && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                            Today
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {slots.length} session{slots.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  {slots.length > 0 ? (
                    <ul className="space-y-3">
                      {slots.map((slot) => (
                        <SlotRow key={slot.id} slot={slot} />
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-3 text-xs font-semibold text-slate-400">
                      Rest and recovery day — no batches scheduled.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-xs font-semibold text-slate-500">
          <Zap className="h-4 w-4 text-amber-500" />
          Batch timings stay fixed through the season. Weather closures are announced on the
          WhatsApp broadcast channel within 30 minutes.
        </div>
      </div>
    </section>
  );
};
