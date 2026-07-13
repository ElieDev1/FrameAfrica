import type { Metadata } from 'next';
import Link from 'next/link';
import { DashTabs } from '@/components/dashboard/DashTabs';
import { listCopyDesk, requireCopyDesk } from '@/lib/cms';
import { workflowTabs } from '@/lib/dash-tabs';
import { formatDate } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Copy desk — Frame Africa' };

export default async function CopyDeskPage() {
  const user = await requireCopyDesk();
  const [items, locale] = await Promise.all([listCopyDesk(), getLocale()]);

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dash.workflow')}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t(locale, 'dpage.copydeskSubtitle')} {items.length} {t(locale, 'dpage.copydeskSuffix')}
      </p>

      <DashTabs tabs={workflowTabs(user.roles)} />

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">
            {t(locale, 'dpage.copyDeskClear')}
          </p>
          <p className="mt-1 font-body text-sm text-muted">{t(locale, 'dpage.nothingCopyEdit')}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/copydesk/${a.id}`}
                className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50"
              >
                <div className="min-w-0">
                  <div className="truncate font-heading font-bold text-text">{a.title}</div>
                  <div className="font-mono text-[11px] text-muted">
                    {a.category.name} · {a.author.displayName} · updated {formatDate(a.updatedAt)}
                  </div>
                </div>
                <span className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary transition group-hover:border-primary">
                  Copy-edit →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
