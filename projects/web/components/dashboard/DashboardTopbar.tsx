import Link from 'next/link';
import { logout } from '@/lib/auth-actions';
import { ThemeToggle } from '../ThemeToggle';

export function DashboardTopbar({ name, role }: { name: string; role: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface/90 px-6 py-3 backdrop-blur">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-primary"
      >
        ← View site
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <p className="font-body text-sm font-semibold leading-tight text-text">{name}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">{role}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted hover:border-accent-red hover:text-accent-red"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
