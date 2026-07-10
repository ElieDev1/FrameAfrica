import type { ReactNode } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';
import { ShieldIcon } from '@/components/icons';

interface Props {
  /** Small kicker above the form heading, e.g. "Welcome back". */
  eyebrow: string;
  /** Form heading. */
  title: string;
  /** One-line subheading under the title. */
  subtitle: string;
  /** The auth form. */
  children: ReactNode;
  /** Links row rendered under the form (forgot password / switch page). */
  footer: ReactNode;
}

/**
 * Centered authentication shell: the form sits in a card in the middle of the
 * page, over the site's own background lifted only by a soft, low-opacity glow
 * and a faint grid — no extra colours.
 */
export function AuthShell({ eyebrow, title, subtitle, children, footer }: Props) {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* faint grid, in the page's own border tone */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-border) 1px, transparent 1px),' +
            'linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 40%, #000 0%, transparent 75%)',
        }}
      />
      {/* single soft glow of the brand accent, very low opacity */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
      />

      <div className="relative z-10 grid min-h-[calc(100vh-3.5rem)] place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface/80 p-8 shadow-xl backdrop-blur-sm sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Link href="/" aria-label="Frame Africa — home" className="mb-6 inline-flex">
              <Wordmark />
            </Link>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-text">
              {title}
            </h1>
            <p className="mt-2 font-body text-sm text-muted">{subtitle}</p>
          </div>

          <div className="mt-8">{children}</div>

          <div className="mt-6 space-y-2 text-center">{footer}</div>

          <p className="mt-8 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-faint">
            <ShieldIcon size={13} className="text-primary" />
            Secured with encrypted sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
