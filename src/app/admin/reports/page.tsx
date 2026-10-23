import type { Metadata } from 'next';
import { PortalPage } from '@/components/app/PortalPage';

export const metadata: Metadata = {
  title: 'Reports',
  description: 'Academy-wide attendance aggregates by sport and student.',
};

export default function AdminReportsPage() {
  return <PortalPage role="ADMIN" initialTab="reports" />;
}
