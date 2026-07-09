import { TrendingDownIcon, TrendingUpIcon } from '@/components/icons';
import { fetchMarkets } from '@/lib/widgets';

/**
 * Live markets — FX (USD/EUR/GBP → RWF) + crypto (BTC/ETH), refreshed every
 * 15 min. Stock indices/commodities land later behind a keyed provider.
 */
export async function MarketsWidget() {
  const rows = await fetchMarkets();

  return (
    <section aria-labelledby="markets" className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="markets" className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Markets
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {rows.length > 0 ? 'Live' : 'Unavailable'}
        </span>
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
        <p className="font-body text-sm text-muted">Markets are unavailable right now.</p>
      )}
    </section>
  );
}
