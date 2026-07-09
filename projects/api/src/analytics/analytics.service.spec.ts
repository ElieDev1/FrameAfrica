import type { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from './analytics.service';

function build() {
  const prisma = {
    pageView: { create: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    article: { findMany: jest.fn() },
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
