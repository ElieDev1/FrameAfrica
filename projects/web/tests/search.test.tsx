import { render, screen } from '@testing-library/react';
import SearchPage from '../app/(site)/search/page';
import { searchArticles, type SearchResult } from '@/lib/api';

jest.mock('@/lib/api', () => ({ searchArticles: jest.fn() }));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: () => undefined }),
  headers: jest.fn().mockResolvedValue({ get: () => undefined }),
}));

const mockSearch = searchArticles as jest.MockedFunction<typeof searchArticles>;

function result(id: string, title: string): SearchResult {
  return {
    id,
    slug: id,
    title,
    subtitle: null,
    excerpt: 'An excerpt.',
    publishedAt: '2026-01-01T00:00:00.000Z',
    snippet: 'A coffee snippet.',
    category: { name: 'Business', slug: 'business' },
    featuredImage: null,
  };
}

describe('SearchPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('prompts and does not query when there is no term', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/type a term/i)).toBeInTheDocument();
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('renders ranked results for a query', async () => {
    mockSearch.mockResolvedValue({ results: [result('a1', 'Coffee climbs')], hasMore: false });

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'coffee' }) }));

    expect(screen.getByRole('heading', { name: 'Coffee climbs' })).toBeInTheDocument();
    expect(mockSearch).toHaveBeenCalledWith({ q: 'coffee', limit: 30 });
  });

  it('shows a no-results message when nothing matches', async () => {
    mockSearch.mockResolvedValue({ results: [], hasMore: false });

    render(await SearchPage({ searchParams: Promise.resolve({ q: 'zzzz' }) }));

    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });
});
