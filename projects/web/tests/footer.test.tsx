import { render, screen } from '@testing-library/react';
import { SiteFooter } from '@/components/SiteFooter';
import { fetchCategories } from '@/lib/api';
import { fetchPublicSiteSettings } from '@/lib/settings';
import type { PublicSiteSettings } from '@/lib/settings-types';

jest.mock('@/lib/api', () => ({ fetchCategories: jest.fn() }));
jest.mock('@/lib/settings', () => ({ fetchPublicSiteSettings: jest.fn() }));
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: () => undefined }),
  headers: jest.fn().mockResolvedValue({ get: () => undefined }),
}));
// The bottom bar's LanguageSwitcher is a client component that reads the router.
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
  usePathname: () => '/',
}));

const mockCategories = fetchCategories as jest.MockedFunction<typeof fetchCategories>;
const mockSite = fetchPublicSiteSettings as jest.MockedFunction<typeof fetchPublicSiteSettings>;

const EMPTY: PublicSiteSettings = { social: [], contactEmail: null, contactPhone: null };

beforeEach(() => {
  mockCategories.mockResolvedValue([
    { id: 'c1', name: 'Business', slug: 'business', description: null, children: [] },
  ]);
  mockSite.mockResolvedValue(EMPTY);
});

describe('SiteFooter', () => {
  it('renders a link for each configured social profile', async () => {
    mockSite.mockResolvedValue({
      social: [
        { key: 'SOCIAL_X_URL', label: 'X (Twitter)', url: 'https://x.com/frameafrica' },
        { key: 'SOCIAL_TIKTOK_URL', label: 'TikTok', url: 'https://tiktok.com/@frameafrica' },
      ],
      contactEmail: 'hello@frameafrica.rw',
      contactPhone: null,
    });

    render(await SiteFooter());

    const x = screen.getByRole('link', { name: 'X (Twitter)' });
    expect(x).toHaveAttribute('href', 'https://x.com/frameafrica');
    // Outbound links must not leak the referrer or hand over window.opener.
    expect(x).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByRole('link', { name: 'TikTok' })).toHaveAttribute(
      'href',
      'https://tiktok.com/@frameafrica',
    );
    expect(screen.getByRole('link', { name: /hello@frameafrica.rw/ })).toHaveAttribute(
      'href',
      'mailto:hello@frameafrica.rw',
    );
  });

  it('hides the social rail entirely when nothing is configured', async () => {
    render(await SiteFooter());

    expect(screen.queryByText('Follow us')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Facebook' })).not.toBeInTheDocument();
    // The rest of the footer still renders.
    expect(screen.getByRole('link', { name: 'Business' })).toBeInTheDocument();
  });

  it('still renders when the API is unreachable', async () => {
    mockCategories.mockRejectedValue(new Error('ECONNREFUSED'));

    render(await SiteFooter());

    expect(screen.getByText(/Frame Africa/)).toBeInTheDocument();
  });
});
