'use client';

import React from 'react';
import { Clock, MapPin, Users, CalendarDays, GraduationCap, Sparkles } from 'lucide-react';
import { ONGOING_CLASSES } from '@/data/publicSiteData';
import { getSport } from '@/lib/sports';
import { SportIcon } from '@/components/app/SportIcon';

export const OngoingClasses: React.FC = () => (
  <section id="classes" className="scroll-mt-20 bg-white py-16 sm:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-800">
          <Sparkles className="h-3 w-3" />
          Enrolling now
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Ongoing Classes
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Eight sports, small batches, and a coach who knows every athlete by name. Pick the
          program that matches where you are today — we will move you up as you progress.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {ONGOING_CLASSES.map((program) => {
          const sport = getSport(program.sportId);

          return (
            <article
              key={program.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={program.imageUrl}
                  alt={`${sport.name} coaching at Vendhan Sports Academy`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                <span
                  className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${sport.accent.soft} ${sport.accent.text}`}
                >
                  <SportIcon sportId={program.sportId} className="h-3.5 w-3.5" />
                  {sport.name}
                </span>

                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-sm font-extrabold leading-tight text-white">
                    {program.headline}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm leading-relaxed text-slate-600">{program.description}</p>

                <div className="mt-4 space-y-2.5 border-y border-slate-100 py-4 text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{program.batchTime}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{program.days.join(' · ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>
                      {program.level} · {program.ageGroup}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2.5">
                  <img
                    src={program.coachAvatar}
                    alt={program.coachName}
                    className="h-9 w-9 rounded-full border-2 border-slate-100 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-slate-900">
                      Coach {program.coachName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {program.coachCredential}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      program.seatsLeft <= 4
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    {program.seatsLeft > 0 ? `${program.seatsLeft} seats left` : 'Waitlist only'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <MapPin className="h-3 w-3" />
                    On campus
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-center">
        <CalendarDays className="h-5 w-5 text-amber-500" />
        <p className="text-sm font-semibold text-slate-600">
          Not sure which program fits? Book a free trial session and let the coaches assess
          the athlete in person.
        </p>
      </div>
    </div>
  </section>
);
