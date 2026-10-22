'use client';

import React from 'react';
import { CalendarClock, MapPin, Users, Trophy, Microscope, PartyPopper, Sparkles } from 'lucide-react';
import { UPCOMING_EVENTS, AcademyEventType, AccentTone } from '@/data/publicSiteData';
import { ACCENT_THEME } from './accentTheme';

const EVENT_ICON: Record<AcademyEventType, React.FC<{ className?: string }>> = {
  Tournament: Trophy,
  'Trial Camp': Microscope,
  'Time Trials': CalendarClock,
  'Sports Day': PartyPopper,
};

const EVENT_TONE: Record<AcademyEventType, AccentTone> = {
  Tournament: 'violet',
  'Trial Camp': 'emerald',
  'Time Trials': 'sky',
  'Sports Day': 'amber',
};

function formatEventDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

export const UpcomingEvents: React.FC = () => (
  <section id="events" className="scroll-mt-20 bg-white py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-700">
          <Sparkles className="h-3 w-3" />
          Mark the calendar
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Upcoming Events
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Tournaments, trial camps and time trials. Parents get a WhatsApp notification the
          moment a squad is confirmed.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {UPCOMING_EVENTS.map((event) => {
          const Icon = EVENT_ICON[event.type];
          const theme = ACCENT_THEME[EVENT_TONE[event.type]];
          const date = formatEventDate(event.date);

          return (
            <article
              key={event.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <span className={`absolute inset-x-0 top-0 h-1.5 ${theme.bar}`} />

              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-xl font-extrabold leading-none text-slate-900">
                    {date.day}
                  </span>
                  <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {date.month}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                    <Icon className="h-3 w-3" />
                    {event.type}
                  </span>
                  <h3 className="mt-2 text-base font-extrabold leading-snug text-slate-900">
                    {event.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {date.weekday}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">{event.description}</p>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  {event.venue}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-slate-400" />
                  {event.audience}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${
                    event.spotsLeft > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : 'Registration closed'}
                </span>
                <button
                  type="button"
                  className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors ${theme.button}`}
                >
                  {event.spotsLeft > 0 ? 'Register' : 'Notify Me'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  </section>
);
