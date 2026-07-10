import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Offline</p>
      <h1 className="mt-2 font-heading text-4xl font-black tracking-tight text-text">
        You&apos;re offline
      </h1>
      <p className="mt-3 font-body text-muted">
        This page isn&apos;t available without a connection. Stories you&apos;ve already opened are
        cached and can still be read — head back and try one of those.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary px-5 py-2 font-heading font-bold text-black transition hover:opacity-90"
      >
        Back to home
      </Link>
    </div>
  );
}
