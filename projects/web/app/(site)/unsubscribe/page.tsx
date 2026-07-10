import type { Metadata } from 'next';
import { UnsubscribeConfirm } from '@/components/UnsubscribeConfirm';

export const metadata: Metadata = { title: 'Unsubscribe', robots: { index: false } };

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const token = ((await searchParams).token ?? '').trim();

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">Newsletter</h1>
      <div className="mt-6">
        {token ? (
          <UnsubscribeConfirm token={token} />
        ) : (
          <p className="font-body text-muted">
            This unsubscribe link is missing its token. Please use the link from a newsletter email.
          </p>
        )}
      </div>
    </div>
  );
}
