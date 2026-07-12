import type { Metadata } from 'next';
import { ModerationQueue } from '@/components/dashboard/ModerationQueue';
import { requireModerator } from '@/lib/cms';
import { fetchModerationQueue } from '@/lib/comments-actions';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Moderation' };

export default async function ModerationPage() {
  await requireModerator();
  const [queue, locale] = await Promise.all([fetchModerationQueue(), getLocale()]);

  return (
    <div className="w-full">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-black tracking-tight text-text">
          {t(locale, 'dash.moderation')}
        </h1>
        <p className="mt-1 max-w-2xl font-body text-sm text-muted">
          {t(locale, 'dpage.moderationSubtitle')} {queue.length}{' '}
          {t(locale, 'dpage.moderationSuffix')}
        </p>
      </header>
      <div className="lg:max-w-4xl">
        <ModerationQueue initial={queue} />
      </div>
    </div>
  );
}
