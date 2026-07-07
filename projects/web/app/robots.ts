import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/site';

/** robots.txt — allow public reading, keep private surfaces out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/account', '/cms', '/login', '/signup', '/reset-password', '/verify-email'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl(),
  };
}
