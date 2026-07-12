import type { MessageKey } from './i18n';

/**
 * The standalone multimedia hubs. "Multimedia" is a taxonomy *container* — it
 * holds no articles of its own, so its section page (and the nav dropdown) send
 * readers to these hubs instead of an empty article list.
 */
export interface MultimediaHub {
  href: string;
  nameKey: MessageKey;
  descKey: MessageKey;
}

export const MULTIMEDIA_SLUG = 'multimedia';

export const MULTIMEDIA_HUBS: MultimediaHub[] = [
  { href: '/videos', nameKey: 'mm.videos', descKey: 'mm.videosSub' },
  { href: '/galleries', nameKey: 'mm.galleries', descKey: 'mm.galleriesSub' },
  { href: '/podcasts', nameKey: 'mm.podcasts', descKey: 'mm.podcastsSub' },
  { href: '/interactives', nameKey: 'mm.interactives', descKey: 'mm.interactivesSub' },
];
