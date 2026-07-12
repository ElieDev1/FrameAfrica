import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { SiteBreadcrumbs, DashboardBreadcrumbs } from '@/components/Breadcrumbs';

jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
// useT returns the English string for a key; enough to assert labels.
jest.mock('@/components/LocaleProvider', () => ({
  useT: () => (key: string) => {
    const map: Record<string, string> = {
      'nav.home': 'Home',
      'nav.breadcrumb': 'Breadcrumb',
      'mm.videos': 'Videos',
      'mm.videoSingular': 'Video',
      'footer.search': 'Search',
    };
    return map[key] ?? key;
  },
}));

const mockPath = usePathname as jest.MockedFunction<typeof usePathname>;

describe('SiteBreadcrumbs', () => {
  it('renders nothing on the homepage', () => {
    mockPath.mockReturnValue('/');
    const { container } = render(<SiteBreadcrumbs />);
    expect(container).toBeEmptyDOMElement();
  });

  it('builds Home › Videos on a hub page, current page unlinked', () => {
    mockPath.mockReturnValue('/videos');
    render(<SiteBreadcrumbs />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    const current = screen.getByText('Videos');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
  });

  it('skips prefix-only segments and humanizes a slug', () => {
    mockPath.mockReturnValue('/article/rwanda-coffee-boom');
    render(<SiteBreadcrumbs />);
    // "article" is a route prefix with no index — it must not appear.
    expect(screen.queryByText(/^article$/i)).not.toBeInTheDocument();
    expect(screen.getByText('Rwanda Coffee Boom')).toBeInTheDocument();
  });

  it('labels an opaque id from its parent collection', () => {
    mockPath.mockReturnValue('/videos/dQw4w9WgXcQ');
    render(<SiteBreadcrumbs />);
    // The hub crumb links; the opaque id becomes "Video", not gibberish.
    expect(screen.getByRole('link', { name: 'Videos' })).toHaveAttribute('href', '/videos');
    expect(screen.getByText('Video')).toHaveAttribute('aria-current', 'page');
  });
});

describe('DashboardBreadcrumbs', () => {
  it('renders nothing at the dashboard root', () => {
    mockPath.mockReturnValue('/dashboard');
    const { container } = render(<DashboardBreadcrumbs />);
    expect(container).toBeEmptyDOMElement();
  });

  it('builds Dashboard › Stories › Details for an edit page', () => {
    mockPath.mockReturnValue('/dashboard/stories/clh3xk9280001qw');
    render(<DashboardBreadcrumbs />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Stories' })).toHaveAttribute(
      'href',
      '/dashboard/stories',
    );
    expect(screen.getByText('Details')).toHaveAttribute('aria-current', 'page');
  });
});
