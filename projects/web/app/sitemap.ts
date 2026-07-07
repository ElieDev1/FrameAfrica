import type { MetadataRoute } from 'next';
import { fetchArticles, fetchCategories } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 3600;

/** XML sitemap: static routes + every published article and section. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'hourly', priority: 1 },
    { url: absoluteUrl('/search'), changeFrequency: 'weekly', priority: 0.3 },
  ];

  try {
    const [{ articles }, categories] = await Promise.all([
      fetchArticles({ limit: 100 }),
      fetchCategories(),
    ]);

    const sectionRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: absoluteUrl(`/section/${c.slug}`),
      changeFrequency: 'daily',
      priority: 0.6,
    }));

    const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
      url: absoluteUrl(`/article/${a.slug}`),
      lastModified: a.publishedAt ?? undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...sectionRoutes, ...articleRoutes];
  } catch {
    // If the API is unreachable, still serve a valid sitemap of static routes.
    return staticRoutes;
  }
}
