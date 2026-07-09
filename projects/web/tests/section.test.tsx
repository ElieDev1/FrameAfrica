import { render, screen } from '@testing-library/react';
import SectionPage from '../app/(site)/section/[slug]/page';
import { fetchArticles, fetchCategory, type ArticleSummary, type CategoryDetail } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchArticles: jest.fn(),
  fetchCategory: jest.fn(),
}));
jest.mock('@/lib/session', () => ({ getSession: jest.fn().mockResolvedValue(null) }));
jest.mock('@/lib/follows-actions', () => ({
  getFollowStatus: jest.fn().mockResolvedValue(null),
  toggleFollow: jest.fn(),
}));

const mockFetchArticles = fetchArticles as jest.MockedFunction<typeof fetchArticles>;
const mockFetchCategory = fetchCategory as jest.MockedFunction<typeof fetchCategory>;

const category: CategoryDetail = {
  id: 'c1',
  name: 'Business',
  slug: 'business',
  description: 'Money, markets, and enterprise across Rwanda.',
  parent: null,
  children: [{ id: 'c2', name: 'Economy', slug: 'economy' }],
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
    publishedAt: '2026-01-01T00:00:00.000Z',
    featuredImage: null,
    category: { id: 'c1', name: 'Business', slug: 'business' },
    author: { id: 'u1', displayName: 'Jane', avatarUrl: null },
    topics: [],
  };
}

describe('SectionPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the section masthead and its articles', async () => {
    mockFetchCategory.mockResolvedValue(category);
    mockFetchArticles.mockResolvedValue({
      articles: [article('a1', 'Coffee exports climb')],
    });

    render(await SectionPage({ params: Promise.resolve({ slug: 'business' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Business' })).toBeInTheDocument();
    expect(screen.getByText(/Money, markets/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Coffee exports climb' })).toBeInTheDocument();
    expect(mockFetchArticles).toHaveBeenCalledWith({ category: 'business', limit: 12 });
    // Sub-section chip links through to the child section.
    expect(screen.getByRole('link', { name: 'Economy' })).toHaveAttribute(
      'href',
      '/section/economy',
    );
  });

  it('calls notFound() for an unknown section', async () => {
    mockFetchCategory.mockResolvedValue(null);

    await expect(SectionPage({ params: Promise.resolve({ slug: 'nope' }) })).rejects.toThrow();
  });
});
