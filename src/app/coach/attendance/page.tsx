import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'Mark Attendance',
  description: 'Mark the attendance sheet for your assigned sports.',
};

export default function CoachAttendancePage() {
  return <PortalPage role="COACH" initialTab="attendance" />;
}
