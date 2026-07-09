import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * Public site shell: the reader-facing header and footer wrap every route in
 * this group. The dashboard lives outside the group (its own layout), so the
 * public chrome never renders there — and navigating between the two crosses a
 * layout boundary, so the chrome mounts/unmounts correctly (no stale header).
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
