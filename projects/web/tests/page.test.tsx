import { render, screen } from '@testing-library/react';
import Home from '../app/(site)/page';
import { fetchArticles, fetchCategories, type ArticleSummary } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchArticles: jest.fn(),
  fetchCategories: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: () => undefined }),
  headers: jest.fn().mockResolvedValue({ get: () => undefined }),
}));

// The Weather/Markets widgets are async server components that fetch live APIs;
// stub them so the homepage renders synchronously in the test.
jest.mock('@/components/WeatherWidget', () => ({ WeatherWidget: () => <h2>Weather</h2> }));
jest.mock('@/components/MarketsWidget', () => ({ MarketsWidget: () => <h2>Markets</h2> }));
// AdSlot is also async (serves a house ad from the API) — stub it too.
jest.mock('@/components/AdSlot', () => ({ AdSlot: () => <aside aria-label="Advertisement" /> }));
// The homepage flyer is its own async server component (it asks the API which
// creative is booked); the page's own rendering is what's under test here.
jest.mock('@/components/FlyerBanner', () => ({
  FlyerBanner: () => <aside aria-label="Advertisement" />,
}));
// VideoStrip is async (reads the cached YouTube uploads).
jest.mock('@/components/VideoStrip', () => ({ VideoStrip: () => <h2>Watch</h2> }));

const mockFetchArticles = fetchArticles as jest.MockedFunction<typeof fetchArticles>;
const mockFetchCategories = fetchCategories as jest.MockedFunction<typeof fetchCategories>;

beforeEach(() => mockFetchCategories.mockResolvedValue([]));

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
    isFeatured: false,
    isLive: false,
    readTimeMin: 3,
    publishedAt: '2026-01-01T00:00:00.000Z',
    featuredImage: null,
    category: { id: 'c1', name: 'Rwanda', slug: 'rwanda' },
    author: { id: 'u1', displayName: 'Jane Uwase', avatarUrl: null, slug: 'jane-uwase' },
    topics: [],
  };
}

describe('Home', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the lead, secondary stories, and a Just-in timeline', async () => {
    mockFetchArticles.mockResolvedValue({
      articles: [sampleArticle('a1', 'Lead story'), sampleArticle('a2', 'Second story')],
    });

    render(await Home());

    expect(screen.getByRole('heading', { name: 'Lead story' })).toBeInTheDocument();
    // "Second story" also appears under Editor's picks and Just in.
    expect(screen.getAllByRole('heading', { name: 'Second story' }).length).toBeGreaterThan(0);
    // The chronological "Just in" rail replaced the popularity list.
    expect(screen.getByRole('heading', { name: 'Just in' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Editor's picks" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weather' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Markets' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Watch/i })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Advertisement').length).toBeGreaterThan(0);
  });

  it('shows a friendly message when the API is unreachable', async () => {
    mockFetchArticles.mockRejectedValue(new Error('unreachable'));

    render(await Home());

    expect(screen.getByText(/short break/i)).toBeInTheDocument();
  });
});
