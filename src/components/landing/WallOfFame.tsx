'use client';

import React from 'react';
import { Trophy, Medal, Award, Crown, Star, Sparkles } from 'lucide-react';
import { HALL_OF_FAME, HallOfFameEntry } from '@/data/publicSiteData';
import { getSport } from '@/lib/sports';
import { SportIcon } from '@/components/app/SportIcon';

const MEDAL_STYLE: Record<
  HallOfFameEntry['medal'],
  { icon: React.FC<{ className?: string }>; chip: string; label: string }
> = {
  Gold: { icon: Medal, chip: 'bg-amber-400/15 text-amber-300 border-amber-400/30', label: 'Gold' },
  Silver: {
    icon: Medal,
    chip: 'bg-slate-300/15 text-slate-200 border-slate-300/30',
    label: 'Silver',
  },
  Bronze: {
    icon: Medal,
    chip: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    label: 'Bronze',
  },
  Trophy: { icon: Trophy, chip: 'bg-amber-400/15 text-amber-300 border-amber-400/30', label: 'Trophy' },
  Badge: { icon: Award, chip: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30', label: 'Badge' },
};

export const WallOfFame: React.FC = () => {
  const [featured, ...rest] = HALL_OF_FAME;

  return (
    <section id="wall-of-fame" className="scroll-mt-20 bg-slate-950 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-300">
              <Crown className="h-3 w-3" />
              Hall of fame
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Wall of Fame
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-400">
              Trophies on the shelf, medals around the neck, and the quiet records that
              only the athlete and their coach know about. These are our own.
            </p>
          </div>

          <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4">
            <div>
              <p className="text-2xl font-extrabold text-amber-400">34</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Titles won
              </p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-2xl font-extrabold text-emerald-400">11</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Athletes podiumed
              </p>
            </div>
          </div>
        </div>

        {/* Featured champion */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <article className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 p-6 lg:col-span-1">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-950">
                <Crown className="h-3 w-3" />
                Academy champion
              </span>
              <div className="mt-5 flex items-center gap-4">
                <img
                  src={featured.photoUrl}
                  alt={featured.athlete}
                  className="h-16 w-16 rounded-2xl border-2 border-amber-400/40 object-cover"
                />
                <div>
                  <p className="text-lg font-extrabold text-white">{featured.title}</p>
                  <p className="text-sm font-semibold text-amber-300">{featured.athlete}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{featured.note}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                {featured.year}
              </p>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {rest.map((entry) => {
              const style = MEDAL_STYLE[entry.medal];
              const Icon = style.icon;
              return (
                <article
                  key={entry.id}
                  className="group flex gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/30 hover:bg-white/[0.06]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <Icon className="h-6 w-6 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${style.chip}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {entry.sportId ? getSport(entry.sportId).name : 'Academy'} · {entry.year}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-extrabold leading-snug text-white">
                      {entry.title}
                    </p>
                    <p className="text-xs font-semibold text-amber-300">{entry.athlete}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{entry.note}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-4 text-center text-xs font-semibold text-slate-400">
          <Star className="h-4 w-4 text-amber-400" />
          Every athlete on this wall started in a beginner batch. Induction happens at the
          annual sports day.
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
      </div>
    </section>
  );
};
