import type { MetadataRoute } from 'next';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

/** Web app manifest — makes Frame Africa installable (WS16). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_TAGLINE,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/brand/icon.png', sizes: '192x192 512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
