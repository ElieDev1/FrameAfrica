import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { AuthorsService } from './authors.service';

/** Just the part of the query the tests assert on. */
interface PublishedOnlyWhere {
  where: { articles: { some: { status: string; deletedAt: null } } };
}

function build() {
  const prisma = {
    user: { findMany: jest.fn<Promise<unknown[]>, [PublishedOnlyWhere]>(), findFirst: jest.fn() },
  };
  return { service: new AuthorsService(prisma as unknown as PrismaService), prisma };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    authorSlug: 'jane-uwase',
    displayName: 'Jane Uwase',
    avatarUrl: null,
    bio: 'Covers Kigali city hall.',
    jobTitle: 'Senior reporter',
    _count: { articles: 12 },
    articles: [{ publishedAt: new Date('2026-07-01T09:00:00Z') }],
    ...overrides,
  };
}

describe('AuthorsService', () => {
  it('lists published authors, most prolific first', async () => {
    const { service, prisma } = build();
    prisma.user.findMany.mockResolvedValue([
      row({ displayName: 'Eric Mugisha', authorSlug: 'eric-mugisha', _count: { articles: 3 } }),
      row(),
    ]);

    const authors = await service.list();

    expect(authors.map((a) => a.slug)).toEqual(['jane-uwase', 'eric-mugisha']);
    expect(authors[0].articleCount).toBe(12);
    expect(authors[0].lastPublishedAt).toBe('2026-07-01T09:00:00.000Z');
  });

  it('only counts stories that are actually out', async () => {
    const { service, prisma } = build();
    prisma.user.findMany.mockResolvedValue([]);

    await service.list();

    const { where } = prisma.user.findMany.mock.calls[0][0];
    expect(where.articles.some.status).toBe('published');
    expect(where.articles.some.deletedAt).toBeNull();
  });

  it('returns the profile behind a byline', async () => {
    const { service, prisma } = build();
    prisma.user.findFirst.mockResolvedValue(row());

    const author = await service.bySlug('jane-uwase');

    expect(author).toEqual({
      slug: 'jane-uwase',
      displayName: 'Jane Uwase',
      avatarUrl: null,
      bio: 'Covers Kigali city hall.',
      jobTitle: 'Senior reporter',
      articleCount: 12,
      lastPublishedAt: '2026-07-01T09:00:00.000Z',
    });
  });

  it('404s for someone who has never published, rather than showing an empty page', async () => {
    // A reader's account has a slug too — asking for it must not confirm it exists.
    const { service, prisma } = build();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.bySlug('some-reader')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('copes with an author whose only story has no publish date', async () => {
    const { service, prisma } = build();
    prisma.user.findFirst.mockResolvedValue(row({ articles: [] }));

    expect((await service.bySlug('jane-uwase')).lastPublishedAt).toBeNull();
  });
});
