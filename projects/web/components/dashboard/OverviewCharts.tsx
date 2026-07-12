'use client';

import { useRef, useState } from 'react';

/** Short weekday+day label for a YYYY-MM-DD key, in the viewer's locale. */
function shortDate(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * 14-day publishing trend — a single-series area + line. One brand accent (the
 * line); everything else recessive. A hover crosshair reads out each day.
 */
export function TrendArea({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  if (data.length === 0) {
    return (
      <div className="grid h-[150px] place-items-center font-mono text-[11px] text-faint">
        No data yet
      </div>
    );
  }

  const W = 560;
  const H = 150;
  const padT = 12;
  const padB = 22;
  const plotH = H - padT - padB;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.count));
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (c: number) => padT + plotH - (c / max) * plotH;

  const line = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)},${padT + plotH} L${x(0).toFixed(1)},${padT + plotH} Z`;
  const total = data.reduce((s, d) => s + d.count, 0);

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const frac = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1)))));
  }

  const hv = hover != null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Articles published per day over the last ${n} days, ${total} in total`}
      >
        {/* baseline + two faint gridlines */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1="0"
            x2={W}
            y1={padT + plotH - f * plotH}
            y2={padT + plotH - f * plotH}
            className="stroke-border"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} className="fill-primary/10" />
        <path
          d={line}
          className="stroke-primary"
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hv && (
          <>
            <line
              x1={x(hover as number)}
              x2={x(hover as number)}
              y1={padT}
              y2={padT + plotH}
              className="stroke-faint"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={x(hover as number)} cy={y(hv.count)} r="3.5" className="fill-primary" />
          </>
        )}
      </svg>

      {/* end labels */}
      <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
        <span>{shortDate(data[0]?.date ?? '')}</span>
        <span>{shortDate(data[n - 1]?.date ?? '')}</span>
      </div>

      {hv && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-elev px-2 py-1 font-mono text-[10px] text-text shadow-sm"
          style={{ left: `${n <= 1 ? 50 : ((hover as number) / (n - 1)) * 100}%` }}
        >
          <span className="font-bold">{hv.count}</span> · {shortDate(hv.date)}
        </div>
      )}
    </div>
  );
}

/**
 * A ranked horizontal bar list — for the pipeline breakdown and top desks. Bars
 * are neutral grey; a single highlighted key (e.g. "published") can carry the
 * brand accent so exactly one thing pops.
 */
export function BarList({
  items,
  highlight,
}: {
  items: { label: string; count: number }[];
  /** Optional label whose bar gets the brand accent instead of neutral grey. */
  highlight?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => {
        const accent = highlight != null && it.label === highlight;
        return (
          <li key={it.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 font-mono text-[11px]">
              <span className="truncate capitalize text-muted">{it.label.replace(/_/g, ' ')}</span>
              <span className="shrink-0 font-bold text-text">{it.count}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-2"
              title={`${it.label}: ${it.count}`}
            >
              <div
                className={`h-full rounded-full ${accent ? 'bg-primary' : 'bg-faint/60'}`}
                style={{ width: `${Math.max(3, (it.count / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
