import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Your academy profile, medical details and sport enrolments.',
};

export default function StudentProfilePage() {
  return <PortalPage role="STUDENT" initialTab="students" />;
}
