/** BCP-47 tags for our UI locales (dates render in the reader's language). */
const DATE_LOCALE: Record<string, string> = { en: 'en-GB', rw: 'rw-RW', fr: 'fr-FR' };

/** Format an ISO timestamp as e.g. "6 Jul 2026" / "6 juil. 2026"; '' when null. */
export function formatDate(iso: string | null, locale = 'en'): string {
  if (!iso) return '';
  const options = { day: 'numeric', month: 'short', year: 'numeric' } as const;
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE[locale] ?? locale, options);
  } catch {
    return new Date(iso).toLocaleDateString('en-GB', options);
  }
}

/**
 * The timestamp a news card wants: relative while the story is fresh
 * ("3 hours ago"), the plain date once it's older than a day. This is the
 * signal that distinguishes a news front from a catalogue — always prefer it
 * over `formatDate` on reader-facing story lists.
 */
export function newsTime(iso: string | null, locale = 'en'): string {
  if (!iso) return '';
  const ageMs = Date.now() - new Date(iso).getTime();
  if (ageMs < 24 * 3_600_000) return timeAgo(iso, locale);
  return formatDate(iso, locale);
}

const JUST_NOW: Record<string, string> = {
  en: 'just now',
  rw: 'nonaha',
  fr: 'à l’instant',
};

const AGO_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_557_600],
  ['month', 2_629_800],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

// Kinyarwanda noun for each unit — Node's ICU only has a narrow "rw" form
// ("-3 h"), so we build the phrase ourselves: "hashize amasaha 3" ("3 hours ago").
const RW_UNITS: Partial<Record<Intl.RelativeTimeFormatUnit, string>> = {
  year: 'imyaka',
  month: 'amezi',
  week: 'ibyumweru',
  day: 'iminsi',
  hour: 'amasaha',
  minute: 'iminota',
};

/**
 * A relative timestamp like "3 hours ago" / "il y a 3 heures", localised via
 * Intl (with a hand-built Kinyarwanda form). Falls back to English if the
 * runtime can't format the locale, and to "just now" under a minute. Empty
 * string when null.
 */
export function timeAgo(iso: string | null, locale = 'en'): string {
  if (!iso) return '';
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return JUST_NOW[locale] ?? JUST_NOW.en;

  let unit: Intl.RelativeTimeFormatUnit = 'minute';
  let value = 1;
  for (const [u, secs] of AGO_UNITS) {
    if (abs >= secs) {
      unit = u;
      value = Math.round(abs / secs);
      break;
    }
  }

  if (locale === 'rw') return `hashize ${RW_UNITS[unit]} ${value}`;
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(-value, unit);
  } catch {
    return new Intl.RelativeTimeFormat('en', { numeric: 'always' }).format(-value, unit);
  }
}
