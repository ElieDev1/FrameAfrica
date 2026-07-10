import type { ReactNode } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';
import {
  BarChartIcon,
  BookmarkIcon,
  type IconProps,
  ShieldIcon,
  SparklesIcon,
} from '@/components/icons';

const HIGHLIGHTS: { icon: (p: IconProps) => ReactNode; title: string; body: string }[] = [
  {
    icon: ShieldIcon,
    title: 'Independent journalism',
    body: 'Verified reporting from Rwanda and across the continent.',
  },
  {
    icon: SparklesIcon,
    title: 'A feed built for you',
    body: 'Briefings tuned to the sections you follow.',
  },
  {
    icon: BookmarkIcon,
    title: 'Save & follow',
    body: 'Bookmark stories and keep the threads you care about.',
  },
  {
    icon: BarChartIcon,
    title: 'Live across Africa',
    body: 'Real-time markets and weather from four capitals.',
  },
];

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.12 0-5.76-2.11-6.7-4.94H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.29a12 12 0 0 0 0 10.78L5.3 14.3Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61L5.3 9.7C6.24 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 12.54c-.03-2.7 2.2-4 2.3-4.06-1.25-1.84-3.2-2.09-3.9-2.12-1.66-.17-3.24.97-4.08.97-.84 0-2.14-.95-3.52-.92-1.81.03-3.48 1.05-4.41 2.67-1.88 3.27-.48 8.1 1.35 10.76.9 1.3 1.97 2.76 3.38 2.71 1.36-.05 1.87-.88 3.52-.88 1.64 0 2.1.88 3.53.85 1.46-.03 2.38-1.33 3.27-2.63 1.03-1.51 1.46-2.97 1.48-3.05-.03-.01-2.84-1.09-2.87-4.32ZM14.4 4.51c.75-.9 1.25-2.16 1.11-3.41-1.08.04-2.38.72-3.15 1.62-.69.8-1.29 2.08-1.13 3.3 1.2.09 2.42-.61 3.17-1.51Z" />
    </svg>
  );
}

/**
 * Social sign-in option. Disabled until OAuth is configured on the API (no
 * provider credentials yet) — shown so the flow is ready and the choice is
 * visible, but honestly marked "soon" rather than pretending to work.
 */
function SocialButton({ provider, icon }: { provider: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      aria-label={`Continue with ${provider} — coming soon`}
      className="relative flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text disabled:cursor-not-allowed disabled:opacity-70"
    >
      {icon}
      Continue with {provider}
      <span className="absolute right-3 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-faint">
        Soon
      </span>
    </button>
  );
}

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
  footer?: ReactNode;
  /** Show the social sign-in buttons + legal consent (login/signup only). */
  showSocial?: boolean;
}

/**
 * Authentication shell: a two-column layout on large screens — an editorial
 * pitch on the left (rendered on the page background, no dark panel) beside the
 * form card on the right. On small screens the pitch drops away and the card
 * centres. The page background is lifted only by a soft glow and a faint grid.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  showSocial = false,
}: Props) {
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

      <div
        className={`relative z-10 mx-auto grid min-h-[calc(100vh-3.5rem)] px-6 py-8 ${
          showSocial
            ? 'max-w-6xl items-center gap-x-14 gap-y-8 lg:grid-cols-2'
            : 'place-items-center'
        }`}
      >
        {/* Left — editorial pitch (login/signup only; on the page background) */}
        {showSocial && (
          <aside className="hidden lg:block">
            <Link href="/" aria-label="Frame Africa — home" className="mb-8 inline-flex">
              <Wordmark />
            </Link>
            <h2 className="font-heading text-[2.5rem] font-black leading-[1.05] tracking-tight text-text">
              The stories shaping <span className="text-primary">a continent</span>.
            </h2>
            <p className="mt-4 max-w-md font-body text-base leading-relaxed text-muted">
              Join Frame Africa for independent reporting, live data, and a reading experience built
              around what matters to you.
            </p>

            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title: t, body }) => (
                <li key={t} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text">{t}</span>
                    <span className="block text-sm text-muted">{body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex items-center gap-5 border-t border-border pt-5 text-[13px] text-faint">
              <span>
                <span className="font-bold text-text">300+</span> stories published
              </span>
              <span className="h-3 w-px bg-border" />
              <span>
                <span className="font-bold text-text">4</span> capitals, live
              </span>
            </div>
          </aside>
        )}

        {/* Right — the auth card */}
        <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-surface/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Link
              href="/"
              aria-label="Frame Africa — home"
              className={`mb-4 inline-flex ${showSocial ? 'lg:hidden' : ''}`}
            >
              <Wordmark />
            </Link>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-1.5 font-heading text-2xl font-black tracking-tight text-text">
              {title}
            </h1>
            <p className="mt-1.5 font-body text-sm text-muted">{subtitle}</p>
          </div>

          {/* Social sign-in (login/signup only) */}
          {showSocial && (
            <>
              <div className="mt-5 space-y-2">
                <SocialButton provider="Google" icon={<GoogleMark />} />
                <SocialButton provider="Apple" icon={<AppleMark />} />
              </div>
              <div className="my-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
                <span className="h-px flex-1 bg-border" />
                or continue with email
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <div className={showSocial ? '' : 'mt-6'}>{children}</div>

          <div className="mt-3 space-y-1.5 text-center">{footer}</div>

          <div className="mt-4 border-t border-border pt-3.5">
            {showSocial && (
              <p className="text-center text-[11px] leading-relaxed text-faint">
                By continuing, you agree to our{' '}
                <Link
                  href="/terms"
                  className="text-muted underline decoration-border underline-offset-2 hover:text-primary"
                >
                  Terms of Use
                </Link>{' '}
                &amp;{' '}
                <Link
                  href="/privacy"
                  className="text-muted underline decoration-border underline-offset-2 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                . We may email you updates — opt out anytime.
              </p>
            )}
            <p
              className={`flex items-center justify-center gap-2 text-xs text-faint ${
                showSocial ? 'mt-2' : ''
              }`}
            >
              <ShieldIcon size={13} className="text-primary" />
              Secured with encrypted sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
