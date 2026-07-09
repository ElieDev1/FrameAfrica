import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AnalyticsOverview {
  readingNow: number;
  totalToday: number;
  topToday: { views: number; article: { id: string; slug: string; title: string } }[];
  topReferrers: { host: string; views: number }[];
}

/**
 * Lightweight, anonymous page-view analytics (documents/14 §8). Records one row
 * per view and derives a real-time editor overview from it — no per-user
 * tracking. Recording is best-effort (never throws into the request).
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(path: string, articleId?: string, referrerHost?: string): Promise<void> {
    try {
      await this.prisma.pageView.create({
        data: {
          path: path.slice(0, 512),
          articleId: articleId ?? null,
          referrerHost: referrerHost ? referrerHost.slice(0, 255) : null,
        },
      });
    } catch {
      // analytics is best-effort
    }
  }

  async overview(): Promise<AnalyticsOverview> {
    const now = Date.now();
    const fiveMinAgo = new Date(now - 5 * 60_000);
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const last24 = new Date(now - 24 * 3_600_000);

    const [readingNow, totalToday, topGroups, refGroups] = await Promise.all([
      this.prisma.pageView.count({ where: { createdAt: { gte: fiveMinAgo } } }),
      this.prisma.pageView.count({ where: { createdAt: { gte: dayStart } } }),
      this.prisma.pageView.groupBy({
        by: ['articleId'],
        where: { createdAt: { gte: dayStart }, articleId: { not: null } },
        _count: { articleId: true },
        orderBy: { _count: { articleId: 'desc' } },
        take: 8,
      }),
      this.prisma.pageView.groupBy({
        by: ['referrerHost'],
        where: { createdAt: { gte: last24 }, referrerHost: { not: null } },
        _count: { referrerHost: true },
        orderBy: { _count: { referrerHost: 'desc' } },
        take: 6,
      }),
    ]);

    const ids = topGroups.map((g) => g.articleId).filter((id): id is string => Boolean(id));
    const articles = await this.prisma.article.findMany({
      where: { id: { in: ids } },
      select: { id: true, slug: true, title: true },
    });
    const topToday = topGroups
      .map((g) => {
        const article = articles.find((a) => a.id === g.articleId);
        return article ? { views: g._count.articleId, article } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const topReferrers = refGroups
      .map((g) => (g.referrerHost ? { host: g.referrerHost, views: g._count.referrerHost } : null))
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return { readingNow, totalToday, topToday, topReferrers };
  }
}
