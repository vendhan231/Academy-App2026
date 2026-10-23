import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'Coach Profile',
  description: 'Your shift, certification and contact details.',
};

export default function CoachProfilePage() {
  return <PortalPage role="COACH" initialTab="staff" />;
}
