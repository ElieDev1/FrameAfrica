/**
 * Markets snapshot (FX + a couple of indices). Indicative static values for now
 * — a real markets feed (documents/00 §4.2 widgets) drops in behind the same
 * shape later.
 */
const ROWS = [
  { name: 'USD / RWF', value: '1,330', change: +0.3 },
  { name: 'EUR / RWF', value: '1,440', change: -0.1 },
  { name: 'RSE All-Share', value: '145.2', change: +0.6 },
  { name: 'Brent Crude', value: '$82.4', change: -0.4 },
] as const;

export function MarketsWidget() {
  return (
    <section aria-labelledby="markets" className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="markets" className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Markets
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          Indicative
        </span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {ROWS.map((r) => {
          const up = r.change >= 0;
          return (
            <li key={r.name} className="flex items-center justify-between gap-3">
              <span className="font-heading text-sm font-semibold text-text">{r.name}</span>
              <span className="flex items-baseline gap-2 font-mono text-sm">
                <span className="text-text">{r.value}</span>
                <span className={up ? 'text-accent-green' : 'text-accent-red'}>
                  {up ? '▲' : '▼'} {Math.abs(r.change).toFixed(1)}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
