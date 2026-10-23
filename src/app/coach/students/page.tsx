import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'My Students',
  description: 'The students enrolled in the sports you coach.',
};

export default function CoachStudentsPage() {
  return <PortalPage role="COACH" initialTab="students" />;
}
