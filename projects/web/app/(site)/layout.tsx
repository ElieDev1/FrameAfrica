import { cookies } from 'next/headers';
import { SiteBreadcrumbs } from '@/components/Breadcrumbs';
import { CookieConsent } from '@/components/CookieConsent';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { CONSENT_COOKIE } from '@/lib/consent';

/**
 * Public site shell: the reader-facing header and footer wrap every route in
 * this group. The dashboard lives outside the group (its own layout), so the
 * public chrome never renders there — and navigating between the two crosses a
 * layout boundary, so the chrome mounts/unmounts correctly (no stale header).
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const consentDecided = Boolean((await cookies()).get(CONSENT_COOKIE));
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-[1440px] px-6 pt-4 empty:hidden">
          <SiteBreadcrumbs />
        </div>
        {children}
      </main>
      <SiteFooter />
      <CookieConsent initialDecided={consentDecided} />
    </>
  );
}
