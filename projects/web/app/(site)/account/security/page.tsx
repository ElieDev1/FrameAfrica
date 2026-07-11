import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TwoFactorSetup } from '@/components/account/TwoFactorSetup';
import { getSession } from '@/lib/session';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, 'account.security')} — Frame Africa` };
}

const STAFF_ROLES = [
  'journalist',
  'sub_editor',
  'photographer',
  'editor',
  'moderator',
  'ads_manager',
  'admin',
];

export default async function SecurityPage() {
  const user = await getSession();
  if (!user) redirect('/login');
  const isStaff = user.roles.some((r) => STAFF_ROLES.includes(r));
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <Link href="/account" className="font-mono text-xs text-primary hover:underline">
        {t(locale, 'common.backToAccount')}
      </Link>
      <h1 className="mt-3 font-heading text-2xl font-black tracking-tight text-text">
        {t(locale, 'account.security')}
      </h1>
      <p className="mt-1 font-body text-sm text-muted">{t(locale, 'account.securitySubtitle')}</p>

      {isStaff && !user.twoFactorEnabled && (
        <div className="mt-4 rounded-xl border-l-4 border-primary bg-surface px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
            {t(locale, 'account.recommendedStaff')}
          </p>
          <p className="mt-1 font-body text-sm text-text">
            {t(locale, 'account.twoFactorStaffNotice')}
          </p>
        </div>
      )}

      <div className="mt-6">
        <TwoFactorSetup enabled={user.twoFactorEnabled ?? false} />
      </div>
    </div>
  );
}
