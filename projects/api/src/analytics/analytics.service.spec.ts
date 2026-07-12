import type { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

function build() {
  const shareSum = { _sum: { shareCount: 0 } };
  const prisma = {
    pageView: {
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    article: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue(shareSum),
    },
    comment: {
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    contentLike: { groupBy: jest.fn().mockResolvedValue([]) },
    video: { aggregate: jest.fn().mockResolvedValue(shareSum) },
    gallery: { aggregate: jest.fn().mockResolvedValue(shareSum) },
    podcastEpisode: { aggregate: jest.fn().mockResolvedValue(shareSum) },
    interactive: { aggregate: jest.fn().mockResolvedValue(shareSum) },
  };
  return { service: new AnalyticsService(prisma as unknown as PrismaService), prisma };
}

describe('AnalyticsService', () => {
  it('records a view (best-effort, never throws)', async () => {
    const { service, prisma } = build();
    prisma.pageView.create.mockRejectedValue(new Error('db down'));
    await expect(service.record('/article/x', 'a1', 'google.com')).resolves.toBeUndefined();
  });

  it('assembles the overview (reading-now, top stories, referrers)', async () => {
    const { service, prisma } = build();
    prisma.pageView.count.mockResolvedValueOnce(3).mockResolvedValueOnce(120); // readingNow, totalToday
    prisma.pageView.groupBy
      .mockResolvedValueOnce([{ articleId: 'a1', _count: { articleId: 40 } }]) // top articles
      .mockResolvedValueOnce([{ referrerHost: 'google.com', _count: { referrerHost: 22 } }]); // referrers
    prisma.article.findMany.mockResolvedValue([{ id: 'a1', slug: 's1', title: 'Top story' }]);

    const res = await service.overview();
    expect(res.readingNow).toBe(3);
    expect(res.totalToday).toBe(120);
    expect(res.topToday).toEqual([
      { views: 40, article: { id: 'a1', slug: 's1', title: 'Top story' } },
    ]);
    expect(res.topReferrers).toEqual([{ host: 'google.com', views: 22 }]);
  });
});
