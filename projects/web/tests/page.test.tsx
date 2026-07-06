import { render, screen } from '@testing-library/react';
import Home from '../app/page';
import { fetchArticles, type ArticleSummary } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchArticles: jest.fn(),
}));

const mockFetchArticles = fetchArticles as jest.MockedFunction<typeof fetchArticles>;

function sampleArticle(id: string, title: string): ArticleSummary {
  return {
    id,
    slug: id,
    title,
    subtitle: null,
    excerpt: 'A short excerpt.',
    language: 'en',
    isPremium: false,
    isBreaking: false,
    readTimeMin: 3,
    publishedAt: '2026-01-01T00:00:00.000Z',
    category: { id: 'c1', name: 'Rwanda', slug: 'rwanda' },
    author: { id: 'u1', displayName: 'Jane Uwase', avatarUrl: null },
  };
}

describe('Home', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the lead and latest stories from the API', async () => {
    mockFetchArticles.mockResolvedValue({
      articles: [sampleArticle('a1', 'Lead story'), sampleArticle('a2', 'Second story')],
    });

    render(await Home());

    expect(screen.getByRole('heading', { name: 'Lead story' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Second story' })).toBeInTheDocument();
  });

  it('shows a friendly message when the API is unreachable', async () => {
    mockFetchArticles.mockRejectedValue(new Error('unreachable'));

    render(await Home());

    expect(screen.getByText(/short break/i)).toBeInTheDocument();
  });
});
