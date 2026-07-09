import type { PrismaService } from '../prisma/prisma.service';
import { SearchService } from './search.service';

function build() {
  const prisma = { $queryRaw: jest.fn() };
  return { service: new SearchService(prisma as unknown as PrismaService), prisma };
}

const row = (id: string) => ({
  id,
  slug: id,
  title: 'Coffee story',
  subtitle: null,
  excerpt: null,
  published_at: new Date('2026-01-01T00:00:00Z'),
  featured_image_url: null,
  featured_image_alt: null,
  category_name: 'Business',
  category_slug: 'business',
  snippet: 'a coffee snippet',
});

describe('SearchService', () => {
  it('returns empty for a blank query without hitting the DB', async () => {
    const { service, prisma } = build();
    const res = await service.search({ q: '   ' });
    expect(res).toEqual({ results: [], hasMore: false, page: 1 });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('maps rows and detects another page', async () => {
    const { service, prisma } = build();
    prisma.$queryRaw.mockResolvedValue([row('a1'), row('a2')]);

    const res = await service.search({ q: 'coffee', limit: 1 });

    expect(res.hasMore).toBe(true);
    expect(res.results).toHaveLength(1);
    expect(res.results[0]).toMatchObject({
      slug: 'a1',
      snippet: 'a coffee snippet',
      category: { name: 'Business', slug: 'business' },
      publishedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('ignores very short suggest queries', async () => {
    const { service, prisma } = build();
    expect(await service.suggest('a')).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});
