import { Injectable } from '@nestjs/common';
import { EngagementTarget } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AnalyticsOverview {
  readingNow: number;
  totalToday: number;
  topToday: { views: number; article: { id: string; slug: string; title: string } }[];
  topReferrers: { host: string; views: number }[];
  /** Site-wide interaction totals across every content type. */
  totals: { views: number; likes: number; comments: number; shares: number };
  /** Every interaction, split by what it happened on — the heart of monitoring. */
  byType: {
    type: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }[];
  /** Views per day for the last 14 days. */
  viewsTrend: { date: string; count: number }[];
  /** Comments per day for the last 14 days. */
  commentsTrend: { date: string; count: number }[];
  /** Comment moderation health. */
  commentStatus: { status: string; count: number }[];
  /** Most-viewed articles all-time. */
  topArticles: { id: string; slug: string; title: string; views: number }[];
}

/** The content types we monitor, with the URL prefix their views are logged under. */
const CONTENT_TYPES: { key: EngagementTarget; label: string; viewPrefix: string }[] = [
  { key: EngagementTarget.article, label: 'articles', viewPrefix: '/article/' },
  { key: EngagementTarget.video, label: 'videos', viewPrefix: '/videos/' },
  { key: EngagementTarget.gallery, label: 'galleries', viewPrefix: '/galleries/' },
  { key: EngagementTarget.episode, label: 'podcasts', viewPrefix: '/podcasts/' },
  { key: EngagementTarget.interactive, label: 'interactives', viewPrefix: '/interactives/' },
];

/** Bucket a list of dates into the last 14 UTC days, oldest first, zero-filled. */
function bucket14(dates: Date[]): { date: string; count: number }[] {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 13);
  const buckets = new Map<string, number>();
  for (let i = 0; i < 14; i += 1) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const dt of dates) {
    const key = dt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
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

    // ── Site-wide interaction monitoring across every content type ──
    const trendStart = new Date();
    trendStart.setUTCHours(0, 0, 0, 0);
    trendStart.setUTCDate(trendStart.getUTCDate() - 13);

    const [
      totalViews,
      viewDates,
      commentDates,
      likeGroups,
      commentTypeGroups,
      commentStatusGroups,
      viewCounts,
      shareSums,
      topArticleRows,
    ] = await Promise.all([
      this.prisma.pageView.count(),
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      this.prisma.comment.findMany({
        where: { deletedAt: null, createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      this.prisma.contentLike.groupBy({ by: ['targetType'], _count: { _all: true } }),
      this.prisma.comment.groupBy({
        by: ['targetType'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.comment.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      Promise.all(
        CONTENT_TYPES.map((ct) =>
          this.prisma.pageView.count({ where: { path: { startsWith: ct.viewPrefix } } }),
        ),
      ),
      Promise.all([
        this.prisma.article.aggregate({ where: { deletedAt: null }, _sum: { shareCount: true } }),
        this.prisma.video.aggregate({ _sum: { shareCount: true } }),
        this.prisma.gallery.aggregate({ where: { deletedAt: null }, _sum: { shareCount: true } }),
        this.prisma.podcastEpisode.aggregate({
          where: { deletedAt: null },
          _sum: { shareCount: true },
        }),
        this.prisma.interactive.aggregate({
          where: { deletedAt: null },
          _sum: { shareCount: true },
        }),
      ]),
      this.prisma.article.findMany({
        where: { deletedAt: null },
        orderBy: { viewCount: 'desc' },
        take: 8,
        select: { id: true, slug: true, title: true, viewCount: true },
      }),
    ]);

    const likeMap = new Map(likeGroups.map((g) => [g.targetType, g._count._all]));
    const commentMap = new Map(commentTypeGroups.map((g) => [g.targetType, g._count._all]));
    const shareByIndex = shareSums.map((s) => s._sum.shareCount ?? 0);

    const byType = CONTENT_TYPES.map((ct, i) => ({
      type: ct.label,
      views: viewCounts[i],
      likes: likeMap.get(ct.key) ?? 0,
      comments: commentMap.get(ct.key) ?? 0,
      shares: shareByIndex[i],
    }));

    const totals = {
      views: totalViews,
      likes: [...likeMap.values()].reduce((s, n) => s + n, 0),
      comments: [...commentMap.values()].reduce((s, n) => s + n, 0),
      shares: shareByIndex.reduce((s, n) => s + n, 0),
    };

    return {
      readingNow,
      totalToday,
      topToday,
      topReferrers,
      totals,
      byType,
      viewsTrend: bucket14(viewDates.map((v) => v.createdAt)),
      commentsTrend: bucket14(commentDates.map((c) => c.createdAt)),
      commentStatus: commentStatusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      topArticles: topArticleRows.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        views: Number(a.viewCount),
      })),
    };
  }
}
