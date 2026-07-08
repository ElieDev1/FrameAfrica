import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TwoFactorSetup } from '@/components/account/TwoFactorSetup';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Security — Frame Africa' };

const STAFF_ROLES = [
  'journalist',
  'sub_editor',
  'photographer',
  'editor',
  'moderator',
  'ads_manager',
  'admin',
];

export default async function SecurityPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  const isStaff = user.roles.some((r) => STAFF_ROLES.includes(r));

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Link href="/account" className="font-mono text-xs text-primary hover:underline">
        ← Account
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-black tracking-tight text-text">Security</h1>
      <p className="mt-1 font-body text-sm text-muted">
        Manage two-factor authentication for your account.
      </p>

      {isStaff && !user.twoFactorEnabled && (
        <div className="mt-4 rounded-xl border-l-4 border-accent-red bg-surface px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-red">
            Required for staff
          </p>
          <p className="mt-1 font-body text-sm text-text">
            Newsroom accounts must enable two-factor authentication to access the dashboard.
          </p>
        </div>
      )}

      <div className="mt-6">
        <TwoFactorSetup enabled={user.twoFactorEnabled ?? false} />
      </div>
    </div>
  );
}
