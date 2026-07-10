import type { ReactNode } from 'react';

/**
 * Shared layout for static legal pages (Privacy, Terms): a centered reading
 * column with a titled header and a consistent prose rhythm.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Legal</p>
      <h1 className="mt-2 font-heading text-4xl font-black tracking-tight text-text">{title}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-faint">
        Last updated {updated}
      </p>
      <p className="mt-6 font-body text-lg leading-relaxed text-muted">{intro}</p>
      <div className="mt-10 space-y-8">{children}</div>
      <p className="mt-12 border-t border-border pt-6 font-body text-sm text-faint">
        Questions? Write to{' '}
        <a
          href="mailto:privacy@frameafrica.news"
          className="text-muted underline hover:text-primary"
        >
          privacy@frameafrica.news
        </a>
        .
      </p>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-bold text-text">{heading}</h2>
      <div className="mt-2 space-y-3 font-body leading-relaxed text-muted">{children}</div>
    </section>
  );
}
