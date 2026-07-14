import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import AuthorPage from '../app/(site)/author/[slug]/page';
import { fetchArticles, fetchAuthor, type ArticleSummary, type AuthorProfile } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchArticles: jest.fn(),
  fetchAuthor: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: () => undefined }),
  headers: jest.fn().mockResolvedValue({ get: () => undefined }),
}));
jest.mock('@/components/AdSlot', () => ({ AdSlot: () => <aside aria-label="Advertisement" /> }));

const mockFetchAuthor = fetchAuthor as jest.MockedFunction<typeof fetchAuthor>;
const mockFetchArticles = fetchArticles as jest.MockedFunction<typeof fetchArticles>;

const author: AuthorProfile = {
  slug: 'jane-uwase',
  displayName: 'Jane Uwase',
  avatarUrl: null,
  bio: 'Covers Kigali city hall and public spending.',
  jobTitle: 'Senior reporter',
  articleCount: 12,
  lastPublishedAt: '2026-07-01T09:00:00.000Z',
};

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
    isFeatured: false,
    isLive: false,
    readTimeMin: 3,
    publishedAt: '2026-07-01T09:00:00.000Z',
    featuredImage: null,
    category: { id: 'c1', name: 'Business', slug: 'business' },
    author: { id: 'u1', displayName: 'Jane Uwase', avatarUrl: null, slug: 'jane-uwase' },
    topics: [],
  };
}

describe('AuthorPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows who the journalist is and what they have published', async () => {
    mockFetchAuthor.mockResolvedValue(author);
    mockFetchArticles.mockResolvedValue({ articles: [article('a1', 'City hall audit')] });

    render(await AuthorPage({ params: Promise.resolve({ slug: 'jane-uwase' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Jane Uwase' })).toBeInTheDocument();
    expect(screen.getByText('Senior reporter')).toBeInTheDocument();
    expect(screen.getByText(/Covers Kigali city hall/)).toBeInTheDocument();
    expect(screen.getByText(/12/)).toBeInTheDocument();
    // The story shows in the grid and again in the "Just in" rail beside it.
    expect(screen.getAllByText('City hall audit').length).toBeGreaterThan(0);
  });

  it('asks only for that author’s stories', async () => {
    mockFetchAuthor.mockResolvedValue(author);
    mockFetchArticles.mockResolvedValue({ articles: [] });

    render(await AuthorPage({ params: Promise.resolve({ slug: 'jane-uwase' }) }));

    expect(mockFetchArticles).toHaveBeenCalledWith(
      expect.objectContaining({ author: 'jane-uwase' }),
    );
  });

  it('404s for a slug that has never published', async () => {
    mockFetchAuthor.mockResolvedValue(null);

    await expect(AuthorPage({ params: Promise.resolve({ slug: 'nobody' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(notFound).toHaveBeenCalled();
  });
});
