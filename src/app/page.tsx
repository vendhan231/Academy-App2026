import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Vendhan Sports Academy | Train, Compete, Conquer',
  description:
    'Badminton, Roller Skating, Chess, Silambam, Archery, Physical Fitness, Yoga and Football coaching for young athletes. Explore ongoing classes, our wall of fame, the weekly schedule and upcoming events at Vendhan Sports Academy.',
};

export default function HomePage() {
  return <LandingPage />;
}
