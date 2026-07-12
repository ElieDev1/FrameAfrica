import { TrendingDownIcon, TrendingUpIcon } from '@/components/icons';
import { LiveBadge } from '@/components/LiveBadge';
import { fetchMarkets } from '@/lib/widgets';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

/**
 * Live markets — FX (USD/EUR/GBP → RWF) + crypto (BTC/ETH), refreshed every
 * 15 min. Stock indices/commodities land later behind a keyed provider.
 */
export async function MarketsWidget() {
  const rows = await fetchMarkets();
  const locale = await getLocale();

  return (
    <section aria-labelledby="markets" className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="markets" className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {t(locale, 'home.markets')}
        </h2>
        <LiveBadge live={rows.length > 0} />
      </div>
      {rows.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => {
            const up = (r.change ?? 0) >= 0;
            return (
              <li key={r.name} className="flex items-center justify-between gap-3">
                <span className="font-heading text-sm font-semibold text-text">{r.name}</span>
                <span className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-text">{r.value}</span>
                  {r.change !== undefined && (
                    <span
                      className={`inline-flex items-center gap-0.5 ${
                        up ? 'text-accent-green' : 'text-accent-red'
                      }`}
                    >
                      {up ? <TrendingUpIcon size={14} /> : <TrendingDownIcon size={14} />}
                      {Math.abs(r.change).toFixed(1)}%
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="font-body text-sm text-muted">{t(locale, 'widgets.marketsUnavailable')}</p>
      )}
    </section>
  );
}
