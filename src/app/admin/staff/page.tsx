import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'Manage Coaches',
  description: 'Coach accounts, certifications and shift records.',
};

export default function AdminStaffPage() {
  return <PortalPage role="ADMIN" initialTab="staff" />;
}
