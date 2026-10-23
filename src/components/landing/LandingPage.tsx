'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Trophy, MapPin, Phone, Mail, Instagram, Twitter, Facebook } from 'lucide-react';
import { PublicHeader } from './PublicHeader';
import { HeroSection } from './HeroSection';
import { OngoingClasses } from './OngoingClasses';
import { WallOfFame } from './WallOfFame';
import { ScheduleSection } from './ScheduleSection';
import { UpcomingEvents } from './UpcomingEvents';
import { RoleBottomNav } from './RoleBottomNav';
import { ACADEMY_PILLARS } from '@/data/publicSiteData';

export const LandingPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main>
        <HeroSection />

        {/* Why Vendhan */}
        <section className="border-b border-slate-200 bg-white py-14">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
            {ACADEMY_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </span>
                <h3 className="mt-4 text-base font-extrabold text-slate-900">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>

        <OngoingClasses />
        <WallOfFame />
        <ScheduleSection />
        <UpcomingEvents />

        {/* Contact / footer band */}
        <section className="bg-slate-950 py-14 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300">
                    <Trophy className="h-5 w-5 text-slate-950" />
                  </span>
                  <span className="text-sm font-extrabold tracking-tight">
                    VENDHAN SPORTS ACADEMY
                  </span>
                </div>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                  Nine seasons of coaching young athletes across eight sports. Walk in for
                  a trial, stay for the trophies.
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Visit us
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    742 Evergreen Terrace, West Hills
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    +1 (555) 019-2831
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    hello@vendhansports.com
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Follow the academy
                </p>
                <div className="mt-4 flex gap-2.5">
                  {[
                    { Icon: Instagram, label: 'Instagram' },
                    { Icon: Twitter, label: 'Twitter' },
                    { Icon: Facebook, label: 'Facebook' },
                  ].map(({ Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-amber-400/40 hover:text-amber-300"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-relaxed text-slate-500">
                  Weather closures, tournament fixtures and fee reminders are sent over
                  WhatsApp to every registered guardian.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Extra bottom padding so the fixed portal bar never hides content. */}
      <div className="h-28 bg-slate-950" />

      <RoleBottomNav onSelectRole={(role) => router.push(`/login?role=${role}`)} />
    </div>
  );
};
