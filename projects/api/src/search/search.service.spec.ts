import type { PrismaService } from '../prisma/prisma.service';
import { SearchService } from './search.service';

function build() {
  const prisma = {
    $queryRaw: jest.fn(),
    // Search also sweeps the multimedia library; empty by default.
    gallery: { findMany: jest.fn().mockResolvedValue([]) },
    podcastEpisode: { findMany: jest.fn().mockResolvedValue([]) },
    video: { findMany: jest.fn().mockResolvedValue([]) },
    interactive: { findMany: jest.fn().mockResolvedValue([]) },
  };
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
    expect(res).toEqual({ results: [], media: [], hasMore: false, page: 1 });
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

  describe('searchMedia', () => {
    it('sweeps every multimedia type and maps each to its public URL', async () => {
      const { service, prisma } = build();
      prisma.gallery.findMany.mockResolvedValue([
        {
          id: 'g1',
          slug: 'kigali-nights',
          title: 'Kigali nights',
          description: null,
          coverUrl: '/c.jpg',
          publishedAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);
      prisma.podcastEpisode.findMany.mockResolvedValue([
        {
          id: 'e1',
          title: 'Coffee economics',
          description: null,
          coverUrl: null,
          publishedAt: null,
          show: { slug: 'the-brief', coverUrl: '/show.jpg' },
        },
      ]);
      prisma.video.findMany.mockResolvedValue([
        {
          id: 'v1',
          youtubeId: 'abc12345678',
          title: 'Coffee explained',
          description: null,
          thumbnailUrl: null,
          publishedAt: new Date('2026-01-02T00:00:00Z'),
        },
      ]);
      prisma.interactive.findMany.mockResolvedValue([
        {
          id: 'i1',
          slug: 'coffee-exports',
          title: 'Coffee exports',
          description: null,
          coverUrl: null,
          publishedAt: null,
        },
      ]);

      const res = await service.searchMedia('coffee');

      expect(res.map((r) => [r.kind, r.url])).toEqual([
        ['gallery', '/galleries/kigali-nights'],
        ['episode', '/podcasts/the-brief'],
        ['video', '/videos'],
        ['interactive', '/interactives/coffee-exports'],
      ]);
      // An episode with no cover of its own falls back to the show's artwork,
      // and a video with no thumbnail falls back to YouTube's.
      expect(res[1].imageUrl).toBe('/show.jpg');
      expect(res[2].imageUrl).toContain('abc12345678');
    });

    it('ignores a one-character query', async () => {
      const { service, prisma } = build();
      expect(await service.searchMedia('a')).toEqual([]);
      expect(prisma.gallery.findMany).not.toHaveBeenCalled();
    });
  });
});
