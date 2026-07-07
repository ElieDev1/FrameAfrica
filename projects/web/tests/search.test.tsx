import { render, screen } from '@testing-library/react';
import SearchPage from '../app/search/page';
import { fetchArticles, type ArticleSummary } from '@/lib/api';

jest.mock('@/lib/api', () => ({ fetchArticles: jest.fn() }));

const mockFetchArticles = fetchArticles as jest.MockedFunction<typeof fetchArticles>;

function article(id: string, title: string): ArticleSummary {
  return {
    id,
    slug: id,
    title,
    subtitle: null,
    excerpt: 'An excerpt.',
    language: 'en',
    isPremium: false,
    isBreaking: false,
    readTimeMin: 3,
    publishedAt: '2026-01-01T00:00:00.000Z',
    featuredImage: null,
    category: { id: 'c1', name: 'Business', slug: 'business' },
    author: { id: 'u1', displayName: 'Jane', avatarUrl: null },
  };
}

describe('SearchPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('prompts and does not query when there is no term', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/type a term/i)).toBeInTheDocument();
    expect(mockFetchArticles).not.toHaveBeenCalled();
  });

  it('renders results for a query', async () => {
    mockFetchArticles.mockResolvedValue({ articles: [article('a1', 'Coffee climbs')] });

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'coffee' }) }));

    expect(screen.getByRole('heading', { name: 'Coffee climbs' })).toBeInTheDocument();
    expect(mockFetchArticles).toHaveBeenCalledWith({ q: 'coffee', limit: 30 });
  });

  it('shows a no-results message when nothing matches', async () => {
    mockFetchArticles.mockResolvedValue({ articles: [] });

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'zzzz' }) }));

    expect(screen.getByText(/no results for/i)).toBeInTheDocument();
  });
});
