import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { fetchPushKey } from '@/lib/push-actions';
import { PushToggle } from './PushToggle';

/**
 * "Alert me when news breaks" — the reader-facing half of web push.
 *
 * Renders nothing at all until the newsroom has generated its web-push keys, so
 * a reader is never offered a button that cannot work.
 */
export async function BreakingAlerts() {
  const [{ publicKey }, locale] = await Promise.all([fetchPushKey(), getLocale()]);
  if (!publicKey) return null;

  return (
    <div className="mt-6 border-t border-border pt-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
        {t(locale, 'push.title')}
      </p>
      <p className="mb-3 mt-1 font-body text-sm leading-snug text-faint">
        {t(locale, 'push.blurb')}
      </p>
      <PushToggle publicKey={publicKey} />
    </div>
  );
}
