export const LOCALES = ['en', 'rw', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'fa-locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  rw: 'Kinyarwanda',
  fr: 'Français',
};

/** UI strings. `en` is the source of truth; `rw`/`fr` mirror its keys. */
const messages = {
  en: {
    'nav.forYou': 'For You',
    'nav.signIn': 'Sign in',
    'nav.subscribe': 'Subscribe',
    'nav.searchPlaceholder': 'Search…',
    'nav.searchAria': 'Search articles',
    'nav.sections': 'Sections',
    'footer.tagline': 'Independent journalism from Kigali for the continent and its diaspora.',
    'footer.language': 'Language',
    'account.forYou': 'For You',
  },
  rw: {
    'nav.forYou': 'Ibyawe',
    'nav.signIn': 'Injira',
    'nav.subscribe': 'Iyandikishe',
    'nav.searchPlaceholder': 'Shakisha…',
    'nav.searchAria': 'Shakisha inkuru',
    'nav.sections': 'Ibyiciro',
    'footer.tagline': 'Itangazamakuru ryigenga rivuye i Kigali ku mugabane no mu banyamahanga.',
    'footer.language': 'Ururimi',
    'account.forYou': 'Ibyawe',
  },
  fr: {
    'nav.forYou': 'Pour vous',
    'nav.signIn': 'Se connecter',
    'nav.subscribe': "S'abonner",
    'nav.searchPlaceholder': 'Rechercher…',
    'nav.searchAria': 'Rechercher des articles',
    'nav.sections': 'Rubriques',
    'footer.tagline': 'Journalisme indépendant depuis Kigali pour le continent et sa diaspora.',
    'footer.language': 'Langue',
    'account.forYou': 'Pour vous',
  },
} satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof (typeof messages)['en'];

/** Translate a key for a locale, falling back to English then the key itself. */
export function t(locale: Locale, key: MessageKey): string {
  return messages[locale]?.[key] ?? messages.en[key] ?? key;
}

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'rw' || value === 'fr';
}
