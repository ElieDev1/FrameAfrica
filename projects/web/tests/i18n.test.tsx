jest.mock('next/headers', () => ({ cookies: jest.fn(), headers: jest.fn() }));

import { DEFAULT_LOCALE, LOCALES, t } from '@/lib/i18n';

describe('i18n', () => {
  it('translates a key to Kinyarwanda', () => {
    expect(t('rw', 'nav.signIn')).toBe('Injira');
    expect(t('rw', 'nav.subscribe')).toBe('Iyandikishe');
  });

  it('translates a key to English', () => {
    expect(t('en', 'nav.signIn')).toBe('Sign in');
  });

  it('translates a key to French', () => {
    expect(t('fr', 'nav.signIn')).toBe('Se connecter');
  });

  it('defaults to English and lists all locales', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect([...LOCALES]).toEqual(['en', 'rw', 'fr']);
  });
});
