/**
 * Canonical site identity for SEO (absolute URLs in metadata, sitemap, robots,
 * and structured data). `SITE_URL` is set per environment; the fallback is the
 * production domain.
 */
export const SITE_URL = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'https://www.frameafrica.rw'
).replace(/\/$/, '');

export const SITE_NAME = 'Frame Africa';
export const SITE_TAGLINE = 'NEWS. VIEWS. AFRICA.';
export const SITE_DESCRIPTION =
  'A modern, AI-assisted digital newspaper for Rwanda and the wider African audience — fast, credible, multilingual news.';

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
