'use client';

import React from 'react';
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import { ACADEMY_STATS } from '@/data/publicSiteData';

export const HeroSection: React.FC = () => {
  const scrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative overflow-hidden bg-slate-950">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-indigo-600/20 blur-3xl" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        {/* Copy column */}
        <div className="animate-rise-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            Admissions open for the season
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Vendhan
            <span className="block bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
              Sports Academy
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Where discipline meets desire. We coach budding champions across{' '}
            <span className="font-semibold text-white">Badminton</span>,{' '}
            <span className="font-semibold text-white">Cricket</span>,{' '}
            <span className="font-semibold text-white">Football</span> and{' '}
            <span className="font-semibold text-white">Swimming</span> — with certified
            coaches, honest progress tracking and a safety-first culture.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              About the academy
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Founded by former national athletes, Vendhan Sports Academy has spent nine
              seasons turning weekend players into competitive regulars. Every athlete is
              profiled for medical needs and skill level on day one, then coached inside
              small batches where nobody gets lost in the crowd. Parents follow the same
              progress feed we use internally — attendance, skill ratings, injuries and
              every trophy, in one place.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => scrollTo('classes')}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-orange-500/25 transition-transform hover:-translate-y-0.5"
            >
              Explore Ongoing Classes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => scrollTo('schedule')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              View Weekly Schedule
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              742 Evergreen Terrace, West Hills
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Liability waiver &amp; medical profile on file
            </span>
          </div>

          {/* Stats strip */}
          <dl className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ACADEMY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
              >
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-2xl font-extrabold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual column */}
        <div className="animate-rise-in relative">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop&q=80"
              alt="Junior athletes training at Vendhan Sports Academy"
              className="h-[26rem] w-full object-cover sm:h-[32rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              6 sessions live today
            </div>

            <div className="absolute bottom-5 left-5 right-5">
              <div className="rounded-2xl border border-white/15 bg-slate-950/75 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                      Next session
                    </p>
                    <p className="mt-1 text-sm font-extrabold text-white">
                      Evening Elite 16:30 - 18:30
                    </p>
                    <p className="text-xs text-slate-300">Badminton Arena A · Coach David Kim</p>
                  </div>
                  <div className="flex -space-x-2">
                    {[
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80',
                    ].map((src) => (
                      <img
                        key={src}
                        src={src}
                        alt=""
                        className="h-8 w-8 rounded-full border-2 border-slate-950 object-cover"
                      />
                    ))}
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-400 text-[10px] font-black text-slate-950">
                      +9
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-4 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
              <Star className="h-4 w-4 text-amber-600" />
            </span>
            <span className="text-xs leading-tight">
              <span className="block font-extrabold text-slate-900">4.9 / 5 parent rating</span>
              <span className="text-slate-500">Across 212 season reviews</span>
            </span>
          </div>

          <div className="absolute -top-5 -right-3 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
              <Users className="h-4 w-4 text-emerald-600" />
            </span>
            <span className="text-xs leading-tight">
              <span className="block font-extrabold text-slate-900">12 certified coaches</span>
              <span className="text-slate-500">Across four disciplines</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
