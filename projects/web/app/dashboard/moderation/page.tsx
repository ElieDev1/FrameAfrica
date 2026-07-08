import type { Metadata } from 'next';
import { ModerationQueue } from '@/components/dashboard/ModerationQueue';
import { requireModerator } from '@/lib/cms';
import { fetchModerationQueue } from '@/lib/comments-actions';

export const metadata: Metadata = { title: 'Moderation' };

export default async function ModerationPage() {
  await requireModerator();
  const queue = await fetchModerationQueue();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-text">Moderation</h1>
        <p className="mt-1 font-body text-sm text-muted">
          Reported comments and anything awaiting review. Keep clears the flags; Hide and Remove
          take it off the article.
        </p>
      </header>
      <ModerationQueue initial={queue} />
    </div>
  );
}
