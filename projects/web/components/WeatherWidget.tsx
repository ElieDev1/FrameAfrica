/**
 * Weather panel for a few key African cities. Data is static/representative for
 * now — a real forecast API (documents/00 §4.2 widgets) drops in behind the same
 * shape later.
 */
const CITIES = [
  { city: 'Kigali', icon: '⛅', cond: 'Partly cloudy', high: 25, low: 15 },
  { city: 'Nairobi', icon: '🌧️', cond: 'Light rain', high: 22, low: 13 },
  { city: 'Lagos', icon: '⛈️', cond: 'Thunderstorms', high: 30, low: 24 },
  { city: 'Kinshasa', icon: '☀️', cond: 'Sunny', high: 31, low: 22 },
] as const;

export function WeatherWidget() {
  return (
    <section aria-labelledby="weather" className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="weather" className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Weather
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Today</span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {CITIES.map((c) => (
          <li key={c.city} className="flex items-center gap-3">
            <span className="text-xl" aria-hidden>
              {c.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold text-text">{c.city}</p>
              <p className="font-mono text-[11px] text-muted">{c.cond}</p>
            </div>
            <p className="font-mono text-sm text-text">
              {c.high}°<span className="text-faint"> / {c.low}°</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
