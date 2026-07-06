import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Rwanda Coffee Exports Climb')).toBe('rwanda-coffee-exports-climb');
  });

  it('strips punctuation and collapses separators', () => {
    expect(slugify('Kigali: a "green" city — 2026!')).toBe('kigali-a-green-city-2026');
  });

  it('strips diacritics', () => {
    expect(slugify('Café société')).toBe('cafe-societe');
  });

  it('falls back to "article" for empty output', () => {
    expect(slugify('!!!')).toBe('article');
  });

  it('caps length at 80 characters', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(80);
  });
});
