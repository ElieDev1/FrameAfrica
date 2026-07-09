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
      <aside className="no-scrollbar sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-surface px-3 py-5 md:flex">
        <Link href="/dashboard" className="px-2">
          <Wordmark size="sm" />
        </Link>
        <DashboardNav roles={user.roles} />
        <p className="mt-auto px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Frame Africa · Newsroom
        </p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar name={user.displayName} role={role} roles={user.roles} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
