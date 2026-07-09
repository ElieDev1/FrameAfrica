import type { Metadata } from 'next';
import { SecureTipForm } from '@/components/SecureTipForm';

export const metadata: Metadata = {
  title: 'Send a secure tip',
  description: 'Share a confidential news tip with the Frame Africa newsroom.',
};

export default function TipsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
        Trust &amp; safety
      </p>
      <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-text">
        Send a secure tip
      </h1>
      <p className="mt-3 font-body text-muted">
        Know something the public should? Tell our newsroom. You don&apos;t have to give your name —
        leave a contact only if you want an editor to follow up.
      </p>

      <ul className="mt-6 space-y-2 border-y border-border py-5 font-body text-sm text-muted">
        <li>• We never publish a tipster&apos;s identity without explicit consent.</li>
        <li>• Tips are stored without your account and read only by senior editors.</li>
        <li>
          • For maximum anonymity, avoid work devices/networks and consider a VPN or the Tor Browser
          — no web form can hide your network metadata by itself.
        </li>
      </ul>

      <div className="mt-6">
        <SecureTipForm />
      </div>
    </div>
  );
}
