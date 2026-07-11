import type { Metadata } from 'next';
import { AuditTable } from '@/components/dashboard/AuditTable';
import { fetchAuditLog, requireAdmin } from '@/lib/cms';
import { t } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export const metadata: Metadata = { title: 'Audit log — Frame Africa' };

export default async function AuditPage() {
  await requireAdmin();
  const [entries, locale] = await Promise.all([fetchAuditLog(), getLocale()]);

  return (
    <div className="w-full">
      <h1 className="font-heading text-3xl font-black tracking-tight text-text">
        {t(locale, 'dash.auditLog')}
      </h1>
      <p className="mt-1 max-w-2xl font-body text-sm text-muted">
        {t(locale, 'dpage.auditSubtitle')} {entries.length} {t(locale, 'dpage.entries')}.
      </p>

      {entries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold text-text">
            {t(locale, 'dpage.nothingLogged')}
          </p>
          <p className="mt-1 font-body text-sm text-muted">{t(locale, 'dpage.auditSubtitle')}</p>
        </div>
      ) : (
        <AuditTable entries={entries} />
      )}
    </div>
  );
}
