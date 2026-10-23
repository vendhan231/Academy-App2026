import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from '@/components/layout/Toaster';
import { themeScript } from '@/components/app/ThemeToggle';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Vendhan Sports Academy | Train, Compete, Conquer',
    template: '%s | Vendhan Sports Academy',
  },
  description:
    'Vendhan Sports Academy trains the next generation of champions across Badminton, Roller Skating, Chess, Silambam, Archery, Physical Fitness, Yoga and Football. Explore ongoing classes, our wall of fame, the weekly schedule and upcoming events.',
  keywords: [
    'Vendhan Sports Academy',
    'sports academy',
    'badminton training',
    'roller skating academy',
    'chess coaching',
    'silambam classes',
    'archery training',
    'fitness coaching',
    'yoga classes',
    'football academy',
  ],
  openGraph: {
    title: 'Vendhan Sports Academy',
    description:
      'A multi-sport academy for budding champions. Eight sports, certified coaching, honest progress tracking and a safety-first culture.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vendhan Sports Academy',
    description: 'Train, compete, conquer — join Vendhan Sports Academy.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-2 text-body antialiased">
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
