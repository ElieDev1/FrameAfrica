import type { Metadata } from 'next';
import Link from 'next/link';
import { DashboardNav, type DashboardRole } from '@/components/dashboard/DashboardNav';
import { DashboardTopbar } from '@/components/dashboard/DashboardTopbar';
import { Wordmark } from '@/components/Wordmark';
import { requireStaff } from '@/lib/cms';

export const metadata: Metadata = { title: 'Dashboard' };

function highestRole(roles: string[]): DashboardRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('editor')) return 'editor';
  return 'journalist';
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const role = highestRole(user.roles);

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-60 shrink-0 flex-col gap-8 border-r border-border bg-surface px-4 py-6 md:flex">
        <Link href="/dashboard" className="px-2">
          <Wordmark size="sm" />
        </Link>
        <DashboardNav role={role} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar name={user.displayName} role={role} />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
