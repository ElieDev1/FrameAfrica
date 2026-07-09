import type { Metadata } from 'next';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'Dashboard' };

// A short display label for the topbar (nav itself is capability-based).
const ROLE_ORDER = [
  'admin',
  'editor',
  'sub_editor',
  'moderator',
  'ads_manager',
  'photographer',
  'journalist',
];

function primaryRole(roles: string[]): string {
  return ROLE_ORDER.find((r) => roles.includes(r)) ?? 'staff';
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const role = primaryRole(user.roles).replace('_', ' ');

  return (
    <div className="flex min-h-screen bg-bg">
      <DashboardSidebar roles={user.roles} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar name={user.displayName} role={role} roles={user.roles} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
