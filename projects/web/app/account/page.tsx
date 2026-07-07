import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { logout } from '@/lib/auth-actions';
import { getSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Your account — Frame Africa' };

const STAFF_ROLES = ['journalist', 'editor', 'admin'];

export default async function AccountPage() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }

  const isStaff = user.roles.some((role) => STAFF_ROLES.includes(role));

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Your account</h1>

      <dl className="mt-8 divide-y divide-border rounded-xl border border-border">
        <Row label="Name" value={user.displayName} />
        <Row label="Email" value={user.email} />
        <Row label="Roles" value={user.roles.join(', ') || 'reader'} />
      </dl>

      {isStaff && (
        <Link
          href="/cms"
          className="mt-8 inline-block font-mono text-sm text-primary hover:underline"
        >
          Go to the newsroom →
        </Link>
      )}

      <form action={logout} className="mt-8 border-t border-border pt-6">
        <button
          type="submit"
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted hover:border-accent-red hover:text-accent-red"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="font-body text-text">{value}</dd>
    </div>
  );
}
