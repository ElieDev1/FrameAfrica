import { WeatherIcon, weatherFromCode } from '@/components/icons';
import { LiveBadge } from '@/components/LiveBadge';
import { fetchWeather } from '@/lib/widgets';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

/** Live weather for a few African capitals (Open-Meteo, refreshed every 15 min). */
export async function WeatherWidget() {
  const cities = await fetchWeather();
  const locale = await getLocale();

  return (
    <section aria-labelledby="weather" className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="weather" className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {t(locale, 'home.weather')}
        </h2>
        <LiveBadge live={cities.length > 0} />
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
                <p className="font-mono text-[11px] text-muted">
                  {t(locale, weatherFromCode(c.code).labelKey)}
                </p>
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
        <p className="font-body text-sm text-muted">{t(locale, 'widgets.weatherUnavailable')}</p>
      )}
    </section>
  );
}
