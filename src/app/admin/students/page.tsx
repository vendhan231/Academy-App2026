import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'Manage Students',
  description: 'The full student directory, enrolments and registrations.',
};

export default function AdminStudentsPage() {
  return <PortalPage role="ADMIN" initialTab="students" />;
}
