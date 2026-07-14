import Link from 'next/link';
import { CloseIcon, SearchIcon } from '@/components/icons';
import { type Locale, type MessageKey, t } from '@/lib/i18n';

/**
 * The search box on a multimedia hub. A plain GET form so it works without JS —
 * it navigates to the hub with `?q=`, which the server component reads and
 * filters on. Submitting always lands on page one (the form carries no `page`).
 */
export function HubSearch({
  basePath,
  q,
  locale,
  placeholderKey,
}: {
  basePath: string;
  q: string;
  locale: Locale;
  placeholderKey: MessageKey;
}) {
  return (
    <form action={basePath} className="flex w-full items-center gap-2 sm:w-80">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
          <SearchIcon size={16} />
        </span>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t(locale, placeholderKey)}
          aria-label={t(locale, placeholderKey)}
          className="w-full rounded-full border border-border bg-surface-2 py-2 pl-9 pr-3 font-body text-sm text-text outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-primary px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-black transition hover:opacity-90"
      >
        {t(locale, 'mm.searchGo')}
      </button>
      {q && (
        <Link
          href={basePath}
          aria-label={t(locale, 'mm.searchClear')}
          title={t(locale, 'mm.searchClear')}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted transition hover:border-primary hover:text-primary"
        >
          <CloseIcon size={16} />
        </Link>
      )}
    </form>
  );
}
