import { WeatherIcon, weatherFromCode } from '@/components/icons';
import { fetchWeather } from '@/lib/widgets';

/** Live weather for a few African capitals (Open-Meteo, refreshed every 15 min). */
export async function WeatherWidget() {
  const cities = await fetchWeather();

  return (
    <section aria-labelledby="weather" className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="weather" className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          Weather
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {cities.length > 0 ? 'Live' : 'Unavailable'}
        </span>
      </div>
      {cities.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {cities.map((c) => (
            <li key={c.city} className="flex items-center gap-3">
              <span className="text-primary" aria-hidden>
                <WeatherIcon code={c.code} size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-text">{c.city}</p>
                <p className="font-mono text-[11px] text-muted">{weatherFromCode(c.code).label}</p>
              </div>
              <p className="font-mono text-sm text-text">
                {c.temp}°
                <span className="text-faint">
                  {' '}
                  {c.high}/{c.low}
                </span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-body text-sm text-muted">Weather is unavailable right now.</p>
      )}
    </section>
  );
}
