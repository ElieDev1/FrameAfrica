import type { Metadata } from 'next';
import { ModerationQueue } from '@/components/dashboard/ModerationQueue';
import { requireModerator } from '@/lib/cms';
import { fetchModerationQueue } from '@/lib/comments-actions';

export const metadata: Metadata = { title: 'Moderation' };

export default async function ModerationPage() {
  await requireModerator();
  const queue = await fetchModerationQueue();

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">Moderation</h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-muted">
          Reported comments and anything awaiting review — {queue.length} in the queue. Keep clears
          the flags; Hide and Remove take it off the article.
        </p>
      </header>
      <div className="lg:max-w-4xl">
        <ModerationQueue initial={queue} />
      </div>
    </div>
  );
}
