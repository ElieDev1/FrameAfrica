import type { Metadata } from 'next';
import { InquiryForm } from '@/components/InquiryForm';

export const metadata: Metadata = {
  title: 'Advertise — Frame Africa',
  description: 'Reach engaged readers across Rwanda and Africa. Tell us about your campaign.',
};

const REASONS = [
  ['Engaged readers', 'A growing, quality audience across Rwanda and the continent.'],
  ['Standard IAB slots', 'Leaderboard, billboard, rectangle, half-page, native and newsletter.'],
  ['Brand-safe', 'Independent journalism your brand can sit beside with confidence.'],
];

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Advertise</p>
      <h1 className="mt-2 font-heading text-4xl font-black tracking-tight text-text">
        Grow with the continent
      </h1>
      <p className="mt-3 max-w-xl font-body text-lg leading-relaxed text-muted">
        Put your brand in front of Frame Africa’s readers. Tell us a little about your campaign and
        our team will come back to you with placements and rates.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {REASONS.map(([title, body]) => (
          <div key={title} className="rounded-xl border border-border bg-surface p-4">
            <p className="font-heading text-sm font-bold text-text">{title}</p>
            <p className="mt-1 font-body text-xs leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <InquiryForm type="advertise" />
      </div>
    </div>
  );
}
