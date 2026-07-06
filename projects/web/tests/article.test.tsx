import { render, screen } from '@testing-library/react';
import ArticlePage from '../app/article/[slug]/page';
import { fetchArticle, type ArticleDetail } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchArticle: jest.fn(),
}));

const mockFetchArticle = fetchArticle as jest.MockedFunction<typeof fetchArticle>;

function sampleArticle(): ArticleDetail {
  return {
    id: 'a1',
    slug: 'rwanda-coffee',
    title: 'Rwanda coffee exports climb',
    subtitle: 'Specialty demand lifts earnings.',
    excerpt: 'An excerpt.',
    language: 'en',
    isPremium: false,
    isBreaking: true,
    readTimeMin: 4,
    publishedAt: '2026-01-01T00:00:00.000Z',
    category: { id: 'c1', name: 'Business', slug: 'business' },
    author: { id: 'u1', displayName: 'Jane Uwase', avatarUrl: null },
    body: 'First paragraph.\n\nSecond paragraph.',
    seo: {},
    viewCount: 10,
    likeCount: 0,
    shareCount: 0,
    updatedAt: '2026-01-02T00:00:00.000Z',
  };
}

describe('ArticlePage', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the headline, byline, and body paragraphs', async () => {
    mockFetchArticle.mockResolvedValue(sampleArticle());

    render(await ArticlePage({ params: Promise.resolve({ slug: 'rwanda-coffee' }) }));

    expect(screen.getByRole('heading', { level: 1, name: /rwanda coffee/i })).toBeInTheDocument();
    expect(screen.getByText('Jane Uwase')).toBeInTheDocument();
    expect(screen.getByText('First paragraph.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
  });

  it('triggers notFound() when the article is missing', async () => {
    mockFetchArticle.mockResolvedValue(null);

    await expect(ArticlePage({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow();
  });
});
