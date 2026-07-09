import { render, screen } from '@testing-library/react';
import ArticlePage from '../app/(site)/article/[slug]/page';
import { fetchArticle, fetchComments, fetchRelated, type ArticleDetail } from '@/lib/api';
import { getSession } from '@/lib/session';

jest.mock('@/lib/api', () => ({
  fetchArticle: jest.fn(),
  fetchRelated: jest.fn(),
  fetchComments: jest.fn(),
  fetchLiveUpdates: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/comments-actions', () => ({ postComment: jest.fn() }));
jest.mock('@/lib/likes-actions', () => ({
  getLikeStatus: jest.fn().mockResolvedValue(null),
  toggleLike: jest.fn(),
}));
jest.mock('@/lib/live-actions', () => ({
  pollLiveUpdates: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/bookmarks-actions', () => ({
  getBookmarkStatus: jest.fn().mockResolvedValue(null),
  toggleBookmark: jest.fn(),
}));

const mockFetchArticle = fetchArticle as jest.MockedFunction<typeof fetchArticle>;
const mockFetchRelated = fetchRelated as jest.MockedFunction<typeof fetchRelated>;
const mockFetchComments = fetchComments as jest.MockedFunction<typeof fetchComments>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

beforeEach(() => {
  mockFetchRelated.mockResolvedValue([]);
  mockFetchComments.mockResolvedValue([]);
  mockGetSession.mockResolvedValue(null);
});

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
    isFeatured: false,
    isLive: false,
    readTimeMin: 4,
    publishedAt: '2026-01-01T00:00:00.000Z',
    featuredImage: null,
    category: { id: 'c1', name: 'Business', slug: 'business' },
    author: { id: 'u1', displayName: 'Jane Uwase', avatarUrl: null },
    topics: [],
    body: 'First paragraph.\n\nSecond paragraph.',
    blocks: [
      { type: 'paragraph', text: 'First paragraph.', lede: true },
      { type: 'paragraph', text: 'Second paragraph.' },
    ],
    seo: {},
    viewCount: 10,
    likeCount: 0,
    shareCount: 0,
    updatedAt: '2026-01-02T00:00:00.000Z',
    corrections: [],
    isLocked: false,
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

  it('renders the featured image with its alt text and credit', async () => {
    mockFetchArticle.mockResolvedValue({
      ...sampleArticle(),
      featuredImage: {
        url: '/seed/coffee.jpg',
        alt: 'Coffee cherries drying',
        credit: 'Frame Africa',
      },
    });

    render(await ArticlePage({ params: Promise.resolve({ slug: 'rwanda-coffee' }) }));

    expect(screen.getByAltText('Coffee cherries drying')).toBeInTheDocument();
    expect(screen.getByText(/Frame Africa/)).toBeInTheDocument();
  });

  it('embeds NewsArticle JSON-LD structured data', async () => {
    mockFetchArticle.mockResolvedValue(sampleArticle());

    const { container } = render(
      await ArticlePage({ params: Promise.resolve({ slug: 'rwanda-coffee' }) }),
    );

    const ld = container.querySelector('script[type="application/ld+json"]');
    expect(ld).not.toBeNull();
    const data = JSON.parse(ld?.innerHTML ?? '{}') as { '@type': string; headline: string };
    expect(data['@type']).toBe('NewsArticle');
    expect(data.headline).toBe('Rwanda coffee exports climb');
  });

  it('renders comments and prompts sign-in when signed out', async () => {
    mockFetchArticle.mockResolvedValue(sampleArticle());
    mockFetchComments.mockResolvedValue([
      {
        id: 'c1',
        body: 'Great piece.',
        createdAt: '2026-01-01T00:00:00.000Z',
        likeCount: 0,
        author: { id: 'u2', displayName: 'Ana K.', avatarUrl: null },
        replies: [],
      },
    ]);

    render(await ArticlePage({ params: Promise.resolve({ slug: 'rwanda-coffee' }) }));

    expect(screen.getByText('Great piece.')).toBeInTheDocument();
    expect(screen.getByText('Ana K.')).toBeInTheDocument();
    // A sign-in prompt appears (the comment form; the like button also links to login).
    expect(screen.getAllByRole('link', { name: /sign in/i }).length).toBeGreaterThan(0);
  });

  it('shows the comment form to a signed-in reader', async () => {
    mockFetchArticle.mockResolvedValue(sampleArticle());
    mockGetSession.mockResolvedValue({
      id: 'u1',
      email: 'reader@example.test',
      displayName: 'Me',
      avatarUrl: null,
      roles: ['reader'],
    });

    render(await ArticlePage({ params: Promise.resolve({ slug: 'rwanda-coffee' }) }));

    expect(screen.getByPlaceholderText(/add to the conversation/i)).toBeInTheDocument();
  });

  it('triggers notFound() when the article is missing', async () => {
    mockFetchArticle.mockResolvedValue(null);

    await expect(ArticlePage({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow();
  });

  it('shows the subscribe prompt and hides the rest of the story when locked', async () => {
    mockFetchArticle.mockResolvedValue({
      ...sampleArticle(),
      isPremium: true,
      isLocked: true,
      body: 'Teaser paragraph only.',
      blocks: [{ type: 'paragraph', text: 'Teaser paragraph only.', lede: true }],
    });

    render(await ArticlePage({ params: Promise.resolve({ slug: 'rwanda-coffee' }) }));

    expect(screen.getByText('Teaser paragraph only.')).toBeInTheDocument();
    expect(screen.getByText('Subscribe to keep reading')).toBeInTheDocument();
  });
});
