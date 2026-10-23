import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'Attendance History',
  description: 'Every attendance sheet you have marked.',
};

export default function CoachHistoryPage() {
  return <PortalPage role="COACH" initialTab="attendance" />;
}
