import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'Attendance',
  description: 'Mark and correct attendance for every sport.',
};

export default function AdminAttendancePage() {
  return <PortalPage role="ADMIN" initialTab="attendance" />;
}
