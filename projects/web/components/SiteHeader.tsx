import Link from 'next/link';

/** Minimal top bar: wordmark + tagline. Section nav lands in a later slice. */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-heading text-xl font-black tracking-tight text-text">
          Frame<span className="text-primary">Africa</span>
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          News. Views. Africa.
        </span>
      </div>
    </header>
  );
}
