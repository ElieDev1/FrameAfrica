import Link from 'next/link';
import { type Locale, t } from '@/lib/i18n';

/**
 * Page-numbered navigation for the multimedia hubs. The API answers "is there a
 * next page?" rather than a total count, so this is a prev/next pager with the
 * current page shown — no page numbers we can't honestly render.
 */
export function Pager({
  locale,
  basePath,
  page,
  hasMore,
  query,
}: {
  locale: Locale;
  basePath: string;
  page: number;
  hasMore: boolean;
  /** Extra query params to preserve across pages (e.g. the hub's `q`). */
  query?: Record<string, string>;
}) {
  if (page === 1 && !hasMore) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(query);
    params.set('page', String(target));
    return `${basePath}?${params.toString()}`;
  };

  const linkCls =
    'rounded-full border border-border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-muted transition hover:border-primary hover:text-primary';
  const mutedCls =
    'rounded-full border border-border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-faint opacity-50';

  return (
    <nav
      aria-label={t(locale, 'pg.label')}
      className="mt-12 flex items-center justify-center gap-4"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkCls} rel="prev">
          ← {t(locale, 'pg.prev')}
        </Link>
      ) : (
        <span className={mutedCls}>← {t(locale, 'pg.prev')}</span>
      )}

      <span className="font-mono text-[11px] uppercase tracking-wide text-faint">
        {t(locale, 'pg.page')} {page}
      </span>

      {hasMore ? (
        <Link href={href(page + 1)} className={linkCls} rel="next">
          {t(locale, 'pg.next')} →
        </Link>
      ) : (
        <span className={mutedCls}>{t(locale, 'pg.next')} →</span>
      )}
    </nav>
  );
}
