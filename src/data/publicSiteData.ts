import { SportId } from '../lib/sports';

/**
 * Content for the public welcome page. Kept separate from the portal data so
 * marketing copy can evolve without touching the operational records.
 */

export interface OngoingClass {
  id: string;
  sportId: SportId;
  headline: string;
  description: string;
  coachName: string;
  coachAvatar: string;
  coachCredential: string;
  batchTime: string;
  days: string[];
  level: string;
  ageGroup: string;
  seatsLeft: number;
  imageUrl: string;
}

export const ONGOING_CLASSES: OngoingClass[] = [
  {
    id: 'class-badminton',
    sportId: 'badminton',
    headline: 'Smash, serve & court craft',
    description: 'Footwork ladders, net play and doubles rotation for players ready to own the forecourt.',
    coachName: 'David Kim',
    coachAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'UEFA “A” License & CSCS Strength Specialist',
    batchTime: '16:30 - 18:30',
    days: ['Mon', 'Tue', 'Thu', 'Sat'],
    level: 'Intermediate',
    ageGroup: 'Ages 9 - 15',
    seatsLeft: 4,
    imageUrl:
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'class-roller-skating',
    sportId: 'roller-skating',
    headline: 'Balance, speed & safe technique',
    description: 'Striding, crossovers and racecraft on the academy rink, with full safety gear provided.',
    coachName: 'Arjun Menon',
    coachAvatar:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'Certified Roller Skating Instructor',
    batchTime: '17:00 - 18:30',
    days: ['Mon', 'Wed', 'Fri', 'Sat'],
    level: 'Beginner',
    ageGroup: 'Ages 6 - 13',
    seatsLeft: 6,
    imageUrl:
      'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'class-chess',
    sportId: 'chess',
    headline: 'Openings, tactics & endgame',
    description: 'Tournament preparation with annotated games, a club database and weekly rated play.',
    coachName: 'Priya Raman',
    coachAvatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'FIDE Chess Arbiter & National Level Player',
    batchTime: '09:00 - 10:30',
    days: ['Tue', 'Thu', 'Sat'],
    level: 'Advanced',
    ageGroup: 'Ages 8 - 18',
    seatsLeft: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'class-silambam',
    sportId: 'silambam',
    headline: 'Wooden stick to first grade',
    description: 'Stance, rhythm and forms rooted in the traditional syllabus, taught with patience.',
    coachName: 'Arjun Menon',
    coachAvatar:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'Silambam Kalaimamani 3rd Grade',
    batchTime: '06:30 - 08:00',
    days: ['Mon', 'Wed', 'Fri'],
    level: 'All levels',
    ageGroup: 'Ages 7 - 16',
    seatsLeft: 8,
    imageUrl:
      'https://images.unsplash.com/photo-1555597673-b21d5c935c30?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'class-archery',
    sportId: 'archery',
    headline: 'Draw, aim & release',
    description: 'Stance, bow control and shot routines on the outdoor range, with equipment supplied.',
    coachName: 'Priya Raman',
    coachAvatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'FIDE Chess Arbiter & State Archery Coach',
    batchTime: '07:30 - 09:00',
    days: ['Tue', 'Thu', 'Sun'],
    level: 'Beginner',
    ageGroup: 'Ages 9 - 18',
    seatsLeft: 7,
    imageUrl:
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'class-physical-fitness',
    sportId: 'physical-fitness',
    headline: 'Strength, speed & conditioning',
    description: 'Age-appropriate strength work, agility ladders and beep-test conditioning blocks.',
    coachName: 'Elena Rostova',
    coachAvatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'NASM Certified & Olympic Bronze Medalist',
    batchTime: '06:00 - 07:15',
    days: ['Mon', 'Wed', 'Fri', 'Sat'],
    level: 'All levels',
    ageGroup: 'Ages 8 - 18',
    seatsLeft: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'class-yoga',
    sportId: 'yoga',
    headline: 'Breath, balance & flexibility',
    description: 'Asana, breathwork and mobility for growing bodies — a calm counterweight to training.',
    coachName: 'Elena Rostova',
    coachAvatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'NASM Certified & Olympic Bronze Medalist',
    batchTime: '06:15 - 07:00',
    days: ['Tue', 'Thu', 'Sun'],
    level: 'All levels',
    ageGroup: 'Ages 6 - 16',
    seatsLeft: 9,
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'class-football',
    sportId: 'football',
    headline: 'Tactics & high-intensity play',
    description: 'Shape, spacing and finishing under fatigue, mirroring real tournament conditions.',
    coachName: 'David Kim',
    coachAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    coachCredential: 'UEFA “A” License & CSCS Strength Specialist',
    batchTime: '06:00 - 08:00',
    days: ['Tue', 'Thu', 'Sat'],
    level: 'Elite',
    ageGroup: 'Ages 11 - 17',
    seatsLeft: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop&q=80',
  },
];

export interface HallOfFameEntry {
  id: string;
  title: string;
  athlete: string;
  sportId: SportId | null;
  year: string;
  medal: 'Gold' | 'Silver' | 'Bronze' | 'Trophy' | 'Badge';
  note: string;
  photoUrl: string;
}

export const HALL_OF_FAME: HallOfFameEntry[] = [
  {
    id: 'hof-1',
    title: 'Inter-Academy Sports Meet — Overall Champions',
    athlete: 'Vendhan Sports Academy',
    sportId: null,
    year: '2026',
    medal: 'Trophy',
    note: 'Swept the golds in chess, archery and football across the regional inter-academy meet.',
    photoUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hof-2',
    title: 'Golden Boot U-13 Invitational',
    athlete: 'Kai Chen',
    sportId: 'football',
    year: '2025',
    medal: 'Trophy',
    note: 'Nine goals in five matches, including a curling 28-yard free kick in the final.',
    photoUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hof-3',
    title: 'State Archery Open — Gold',
    athlete: 'Aryan Patel',
    sportId: 'archery',
    year: '2026',
    medal: 'Gold',
    note: 'New state age record of 682 points, holding the lead from the very first end.',
    photoUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hof-4',
    title: 'State U-12 Chess Champion',
    athlete: 'Maya Vendhan',
    sportId: 'chess',
    year: '2025',
    medal: 'Gold',
    note: 'An undefeated run through seven rounds, finishing with 94% accuracy.',
    photoUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hof-5',
    title: 'Skating Nationals — Podium Finish',
    athlete: 'Sofia Rodriguez',
    sportId: 'roller-skating',
    year: '2026',
    medal: 'Bronze',
    note: 'Third in the 100m sprint final and the fastest junior lap time of the meet.',
    photoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'hof-6',
    title: 'Inter-Academy Chess — Team Gold',
    athlete: 'Meera Iyer',
    sportId: 'chess',
    year: '2026',
    medal: 'Gold',
    note: 'Anchored the academy’s first inter-academy title with two board wins.',
    photoUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
];

export type ScheduleDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export const SCHEDULE_DAYS: ScheduleDay[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export interface ScheduleSlot {
  id: string;
  day: ScheduleDay;
  startTime: string;
  endTime: string;
  sportId: SportId;
  batch: string;
  coach: string;
  venue: string;
  focus: string;
}

export const WEEK_SCHEDULE: ScheduleSlot[] = [
  {
    id: 'slot-1',
    day: 'Monday',
    startTime: '06:00',
    endTime: '07:15',
    sportId: 'physical-fitness',
    batch: 'Morning Squad',
    coach: 'Elena Rostova',
    venue: 'Fitness Studio',
    focus: 'Strength circuit & agility ladders',
  },
  {
    id: 'slot-2',
    day: 'Monday',
    startTime: '06:30',
    endTime: '08:00',
    sportId: 'silambam',
    batch: 'Morning Squad',
    coach: 'Arjun Menon',
    venue: 'Silambam Dojo',
    focus: 'Forms, stance & rhythm',
  },
  {
    id: 'slot-3',
    day: 'Monday',
    startTime: '16:30',
    endTime: '18:30',
    sportId: 'badminton',
    batch: 'Evening Elite',
    coach: 'David Kim',
    venue: 'Badminton Hall A',
    focus: 'Doubles rotation & net drills',
  },
  {
    id: 'slot-4',
    day: 'Tuesday',
    startTime: '06:00',
    endTime: '08:00',
    sportId: 'football',
    batch: 'Morning Squad',
    coach: 'David Kim',
    venue: 'Turf Stadium Arena 1',
    focus: 'Pressing triggers & transition play',
  },
  {
    id: 'slot-5',
    day: 'Tuesday',
    startTime: '09:00',
    endTime: '10:30',
    sportId: 'chess',
    batch: 'Club Session',
    coach: 'Priya Raman',
    venue: 'Strategy Room',
    focus: 'Openings & annotated games',
  },
  {
    id: 'slot-6',
    day: 'Wednesday',
    startTime: '06:15',
    endTime: '07:00',
    sportId: 'yoga',
    batch: 'Morning Squad',
    coach: 'Elena Rostova',
    venue: 'Yoga Studio',
    focus: 'Asana flow & breathwork',
  },
  {
    id: 'slot-7',
    day: 'Wednesday',
    startTime: '07:30',
    endTime: '09:00',
    sportId: 'archery',
    batch: 'Range Session',
    coach: 'Priya Raman',
    venue: 'Archery Range',
    focus: 'Draw cycle & shot routine',
  },
  {
    id: 'slot-8',
    day: 'Thursday',
    startTime: '06:00',
    endTime: '08:00',
    sportId: 'football',
    batch: 'Morning Squad',
    coach: 'David Kim',
    venue: 'Turf Stadium Arena 1',
    focus: 'Finishing under fatigue',
  },
  {
    id: 'slot-9',
    day: 'Thursday',
    startTime: '16:30',
    endTime: '18:30',
    sportId: 'badminton',
    batch: 'Evening Elite',
    coach: 'David Kim',
    venue: 'Badminton Hall A',
    focus: 'Footwork ladder & smash defence',
  },
  {
    id: 'slot-10',
    day: 'Friday',
    startTime: '06:00',
    endTime: '07:15',
    sportId: 'physical-fitness',
    batch: 'Morning Squad',
    coach: 'Elena Rostova',
    venue: 'Fitness Studio',
    focus: 'Beep test & conditioning',
  },
  {
    id: 'slot-11',
    day: 'Friday',
    startTime: '17:00',
    endTime: '18:30',
    sportId: 'roller-skating',
    batch: 'Evening Squad',
    coach: 'Arjun Menon',
    venue: 'Skating Rink',
    focus: 'Crossovers & racecraft',
  },
  {
    id: 'slot-12',
    day: 'Saturday',
    startTime: '07:00',
    endTime: '09:00',
    sportId: 'chess',
    batch: 'Weekend Club',
    coach: 'Priya Raman',
    venue: 'Strategy Room',
    focus: 'Rated tournament play',
  },
  {
    id: 'slot-13',
    day: 'Saturday',
    startTime: '09:30',
    endTime: '11:00',
    sportId: 'archery',
    batch: 'Weekend Squad',
    coach: 'Priya Raman',
    venue: 'Archery Range',
    focus: 'Match simulation',
  },
  {
    id: 'slot-14',
    day: 'Sunday',
    startTime: '07:00',
    endTime: '08:30',
    sportId: 'silambam',
    batch: 'Weekend Squad',
    coach: 'Arjun Menon',
    venue: 'Silambam Dojo',
    focus: 'Grading & sparring',
  },
  {
    id: 'slot-15',
    day: 'Sunday',
    startTime: '09:00',
    endTime: '10:30',
    sportId: 'yoga',
    batch: 'Weekend Squad',
    coach: 'Elena Rostova',
    venue: 'Yoga Studio',
    focus: 'Open practice & flexibility',
  },
];

export type AcademyEventType = 'Tournament' | 'Trial Camp' | 'Time Trials' | 'Sports Day';
export type AccentTone = 'emerald' | 'amber' | 'sky' | 'violet';

export interface AcademyEvent {
  id: string;
  title: string;
  type: AcademyEventType;
  date: string;
  time: string;
  venue: string;
  audience: string;
  spotsLeft: number;
  description: string;
}

export const UPCOMING_EVENTS: AcademyEvent[] = [
  {
    id: 'event-1',
    title: 'Inter-Academy Chess Championship',
    type: 'Tournament',
    date: '2026-10-25',
    time: '09:00 - 14:00',
    venue: 'Strategy Room',
    audience: 'U-10 to U-18 squads',
    spotsLeft: 12,
    description:
      'Six rounds of rated play against eight academies. Score sheets and club clocks are provided.',
  },
  {
    id: 'event-2',
    title: 'Metro U-14 Football Qualifiers',
    type: 'Tournament',
    date: '2026-11-02',
    time: '08:00 - 14:00',
    venue: 'Turf Stadium Arena 1',
    audience: 'U-14 football squad',
    spotsLeft: 18,
    description:
      'Regional qualifier against Metro Elite, Metro United and Harbour Rovers. Full travelling kit required.',
  },
  {
    id: 'event-3',
    title: 'Archery State Open — Qualifiers',
    type: 'Time Trials',
    date: '2026-11-09',
    time: '07:30 - 12:00',
    venue: 'Archery Range',
    audience: 'All archery squads',
    spotsLeft: 9,
    description: 'Official state qualifier across 30m and 50m recurve, scored by a state judge.',
  },
  {
    id: 'event-4',
    title: 'All-Sports Open Trial Camp',
    type: 'Trial Camp',
    date: '2026-11-16',
    time: '08:00 - 13:00',
    venue: 'Main Academy Ground',
    audience: 'Open to all, ages 6 - 18',
    spotsLeft: 24,
    description:
      'A free selection camp across all eight sports. Bring water, indoor shoes and a packed lunch.',
  },
  {
    id: 'event-5',
    title: 'Annual Sports Day & Awards Night',
    type: 'Sports Day',
    date: '2026-11-28',
    time: '15:00 - 19:00',
    venue: 'Main Academy Ground',
    audience: 'Whole academy & families',
    spotsLeft: 0,
    description:
      'House relay finals, parent-child events, the annual trophy handover and the wall of fame induction.',
  },
];

export const ACADEMY_STATS = [
  { value: '148', label: 'Active Athletes' },
  { value: '8', label: 'Sports Programs' },
  { value: '24', label: 'Active Courts' },
  { value: '9', label: 'Years of Legacy' },
];

export const ACADEMY_PILLARS = [
  {
    title: 'Certified Coaching',
    body: 'Every batch is led by a licensed coach with competitive backgrounds and child-safety clearance.',
  },
  {
    title: 'Safety First',
    body: 'Liability waivers, medical profiles and emergency contacts are tracked for every single athlete.',
  },
  {
    title: 'Progress You Can See',
    body: 'Attendance, skill ratings, injuries and achievements are logged in one place, visible to coaches and parents.',
  },
];
