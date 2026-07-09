/**
 * Server-side data for the homepage widgets. These call free, keyless public
 * APIs from the Next server (not the browser), so the CSP does not apply. Every
 * fetch is cached (15 min) and fails soft — a widget renders an "unavailable"
 * state rather than breaking the page.
 */

const REVALIDATE = 900; // 15 minutes

export interface CityWeather {
  city: string;
  code: number;
  temp: number;
  high: number;
  low: number;
}

const CITIES = [
  { city: 'Kigali', lat: -1.94, lon: 30.06 },
  { city: 'Nairobi', lat: -1.29, lon: 36.82 },
  { city: 'Lagos', lat: 6.45, lon: 3.39 },
  { city: 'Kinshasa', lat: -4.32, lon: 15.31 },
];

interface OpenMeteoLocation {
  current?: { temperature_2m?: number; weather_code?: number };
  daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
}

/** Live conditions for a few African capitals (Open-Meteo, no key). */
export async function fetchWeather(): Promise<CityWeather[]> {
  const latitude = CITIES.map((c) => c.lat).join(',');
  const longitude = CITIES.map((c) => c.lon).join(',');
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return [];
    const json = (await res.json()) as OpenMeteoLocation | OpenMeteoLocation[];
    // Open-Meteo returns an array when multiple locations are requested.
    const locations = Array.isArray(json) ? json : [json];
    return locations.map((loc, i) => ({
      city: CITIES[i]?.city ?? '',
      code: loc.current?.weather_code ?? 3,
      temp: Math.round(loc.current?.temperature_2m ?? 0),
      high: Math.round(loc.daily?.temperature_2m_max?.[0] ?? 0),
      low: Math.round(loc.daily?.temperature_2m_min?.[0] ?? 0),
    }));
  } catch {
    return [];
  }
}

export interface MarketRow {
  name: string;
  value: string;
  /** 24h % change (crypto only); FX rows omit it. */
  change?: number;
}

function fmt(n: number): string {
  return n >= 100
    ? n.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

interface ErApiResponse {
  result?: string;
  rates?: Record<string, number>;
}
interface CoinGeckoResponse {
  [id: string]: { usd?: number; usd_24h_change?: number };
}

/** Live FX (USD/EUR/GBP → RWF) + crypto (BTC/ETH). Keyless. */
export async function fetchMarkets(): Promise<MarketRow[]> {
  const rows: MarketRow[] = [];

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: REVALIDATE },
    });
    if (res.ok) {
      const json = (await res.json()) as ErApiResponse;
      const r = json.rates ?? {};
      if (r.RWF) {
        rows.push({ name: 'USD / RWF', value: fmt(r.RWF) });
        if (r.EUR) rows.push({ name: 'EUR / RWF', value: fmt(r.RWF / r.EUR) });
        if (r.GBP) rows.push({ name: 'GBP / RWF', value: fmt(r.RWF / r.GBP) });
      }
    }
  } catch {
    // FX unavailable — fall through to crypto.
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: REVALIDATE } },
    );
    if (res.ok) {
      const j = (await res.json()) as CoinGeckoResponse;
      if (j.bitcoin?.usd) {
        rows.push({
          name: 'BTC / USD',
          value: `$${fmt(j.bitcoin.usd)}`,
          change: round1(j.bitcoin.usd_24h_change ?? 0),
        });
      }
      if (j.ethereum?.usd) {
        rows.push({
          name: 'ETH / USD',
          value: `$${fmt(j.ethereum.usd)}`,
          change: round1(j.ethereum.usd_24h_change ?? 0),
        });
      }
    }
  } catch {
    // crypto unavailable
  }

  return rows;
}
