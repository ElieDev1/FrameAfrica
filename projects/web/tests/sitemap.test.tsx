import sitemap from '../app/sitemap';
import { fetchArticles, fetchCategories } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchArticles: jest.fn(),
  fetchCategories: jest.fn(),
}));

const mockFetchArticles = fetchArticles as jest.MockedFunction<typeof fetchArticles>;
const mockFetchCategories = fetchCategories as jest.MockedFunction<typeof fetchCategories>;

describe('sitemap', () => {
  afterEach(() => jest.clearAllMocks());

  it('lists static routes plus every article and section as absolute URLs', async () => {
    mockFetchArticles.mockResolvedValue({
      articles: [
        {
          id: 'a1',
          slug: 'rwanda-coffee',
          title: 'T',
          subtitle: null,
          excerpt: null,
          language: 'en',
          isPremium: false,
          isBreaking: false,
          readTimeMin: 3,
          publishedAt: '2026-01-01T00:00:00.000Z',
          featuredImage: null,
          category: { id: 'c1', name: 'Business', slug: 'business' },
          author: { id: 'u1', displayName: 'Jane', avatarUrl: null },
          topics: [],
        },
      ],
    });
    mockFetchCategories.mockResolvedValue([
      { id: 'c1', name: 'Business', slug: 'business', description: null, children: [] },
    ]);

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toEqual(expect.arrayContaining([expect.stringMatching(/\/$/)]));
    expect(urls.some((u) => u.endsWith('/article/rwanda-coffee'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/section/business'))).toBe(true);
    expect(urls.every((u) => u.startsWith('http'))).toBe(true);
  });

  it('falls back to static routes when the API is unreachable', async () => {
    mockFetchArticles.mockRejectedValue(new Error('down'));
    mockFetchCategories.mockRejectedValue(new Error('down'));

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.url.endsWith('/'))).toBe(true);
  });
});
