import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'My Attendance',
  description: 'Your attendance history and monthly summary.',
};

export default function StudentAttendancePage() {
  return <PortalPage role="STUDENT" initialTab="attendance" />;
}
