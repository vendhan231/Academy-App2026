import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/context/AppContext';
import { Toaster } from '@/components/layout/Toaster';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Vendhan Sports Academy | Train, Compete, Conquer',
    template: '%s | Vendhan Sports Academy',
  },
  description:
    'Vendhan Sports Academy trains the next generation of champions across Badminton, Cricket, Football and Swimming. Explore ongoing classes, our wall of fame, the weekly schedule and upcoming events.',
  keywords: [
    'Vendhan Sports Academy',
    'sports academy',
    'badminton training',
    'cricket coaching',
    'football academy',
    'swimming coaching',
    'sports school',
  ],
  openGraph: {
    title: 'Vendhan Sports Academy',
    description:
      'A multi-sport academy for budding champions. Badminton, Cricket, Football and Swimming with certified coaching.',
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <AppProvider>
          {children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
