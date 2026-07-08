import type { Metadata } from 'next';
import Link from 'next/link';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { Wordmark } from '@/components/Wordmark';
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
      <aside className="hidden w-60 shrink-0 flex-col gap-8 border-r border-border bg-surface px-4 py-6 md:flex">
        <Link href="/dashboard" className="px-2">
          <Wordmark size="sm" />
        </Link>
        <DashboardNav roles={user.roles} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar name={user.displayName} role={role} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
