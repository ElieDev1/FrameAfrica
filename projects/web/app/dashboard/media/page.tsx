import type { Metadata } from 'next';
import Link from 'next/link';
import { AlbumRail } from '@/components/cms/AlbumRail';
import { MediaGrid } from '@/components/cms/MediaGrid';
import { MediaUpload } from '@/components/cms/MediaUpload';
import { ActivityIcon, ImageIcon, LayersIcon, PlayIcon } from '@/components/icons';
import { Pager } from '@/components/Pager';
import { isEditor, listAlbums, listMedia, type MediaKind, requireStaff } from '@/lib/cms';
import { formatDate } from '@/lib/format';
import { type MessageKey, t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { readPage } from '@/lib/paging';

export const metadata: Metadata = { title: 'Media library — Frame Africa' };

const PAGE_SIZE = 24;

const KINDS: { key: MediaKind | 'all'; labelKey: MessageKey }[] = [
  { key: 'all', labelKey: 'dmg.kindAll' },
  { key: 'image', labelKey: 'dmg.kindImages' },
  { key: 'video', labelKey: 'dmg.kindVideo' },
  { key: 'audio', labelKey: 'dmg.kindAudio' },
];

function asKind(value?: string): MediaKind | undefined {
  return value === 'image' || value === 'video' || value === 'audio' ? value : undefined;
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: (p: { size?: number; className?: string }) => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted ring-1 ring-border">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-xl font-black tabular-nums leading-none text-text">
          {value.toLocaleString()}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {label}
        </span>
      </span>
    </div>
  );
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ album?: string; kind?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const album = sp.album?.trim() || undefined;
  const kind = asKind(sp.kind);
  const page = readPage(sp.page);

  const user = await requireStaff();
  const [{ items: assets, hasMore }, { albums, unfiled, counts }, locale] = await Promise.all([
    listMedia(album, kind, page, PAGE_SIZE),
    listAlbums(),
    getLocale(),
  ]);

  const openAlbum = album && album !== 'unfiled' ? albums.find((a) => a.id === album) : undefined;

  /** Album + kind survive a page change; changing a filter resets to page one. */
  const href = (next: { kind?: MediaKind | 'all'; page?: number }) => {
    const q = new URLSearchParams();
    if (album) q.set('album', album);
    const k = next.kind ?? kind;
    if (k && k !== 'all') q.set('kind', k);
    if (next.page && next.page > 1) q.set('page', String(next.page));
    const s = q.toString();
    return s ? `/dashboard/media?${s}` : '/dashboard/media';
  };

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dash.mediaLibrary')}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t(locale, 'dpage.mediaSubtitle')}
      </p>

      {/* Library at a glance */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t(locale, 'dmg.totalFiles')} value={counts.total} icon={LayersIcon} />
        <StatTile label={t(locale, 'dmg.kindImages')} value={counts.image} icon={ImageIcon} />
        <StatTile label={t(locale, 'dmg.kindVideo')} value={counts.video} icon={PlayIcon} />
        <StatTile label={t(locale, 'dmg.kindAudio')} value={counts.audio} icon={ActivityIcon} />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        {/* Folders */}
        <AlbumRail
          albums={albums}
          unfiled={unfiled}
          total={counts.total}
          current={album}
          canManage={isEditor(user) || user.roles.includes('photographer')}
        />

        {/* Files */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Where am I + file-kind tabs */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <div className="min-w-0">
              <h2 className="truncate font-heading text-xl font-black tracking-tight text-text">
                {openAlbum
                  ? openAlbum.name
                  : album === 'unfiled'
                    ? t(locale, 'dmg.unfiled')
                    : t(locale, 'dmg.allFiles')}
              </h2>
              <p className="mt-0.5 font-mono text-[11px] text-faint">
                {openAlbum?.eventDate ? `${formatDate(openAlbum.eventDate)} · ` : ''}
                {openAlbum ? openAlbum.assetCount : assets.length} {t(locale, 'dmg.files')}
                {openAlbum?.description ? ` · ${openAlbum.description}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
              {KINDS.map((item) => {
                const on = (kind ?? 'all') === item.key;
                return (
                  <Link
                    key={item.key}
                    href={href({ kind: item.key })}
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition ${
                      on
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted hover:border-primary hover:text-primary'
                    }`}
                  >
                    {t(locale, item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Uploads land in the album you're browsing */}
          <MediaUpload albumId={openAlbum?.id} albumName={openAlbum?.name} />

          <MediaGrid assets={assets} albums={albums} canDelete={isEditor(user)} />

          <Pager
            locale={locale}
            basePath="/dashboard/media"
            page={page}
            hasMore={hasMore}
            query={{
              ...(album ? { album } : {}),
              ...(kind ? { kind } : {}),
            }}
          />
        </div>
      </div>
    </div>
  );
}
