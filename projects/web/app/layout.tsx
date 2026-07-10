import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Roboto } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { getLocale } from '@/lib/i18n-server';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import './globals.css';

// One family across the whole system — Roboto — for headlines, body, and UI
// chrome. Heavier weights carry the headlines; regular carries reading text.
const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_RW',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
  ],
};

// Resolves the theme before first paint (stored choice → system preference →
// dark) so the page never flashes the wrong palette.
const themeScript = `(function(){try{var t=localStorage.getItem('fa-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

// Injected raw so the ::-webkit-scrollbar rules survive (Tailwind/Lightning CSS
// strips them from the stylesheet). Slim bars everywhere; `.no-scrollbar` hides
// them entirely (still scrollable) — used by the dashboard sidebar/drawer.
const scrollbarCss = `
*{scrollbar-width:thin;scrollbar-color:var(--color-border-2) transparent}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:var(--color-border-2);border-radius:9999px}
::-webkit-scrollbar-thumb:hover{background:var(--color-faint)}
::-webkit-scrollbar-track{background:transparent}
.no-scrollbar{scrollbar-width:none}
.no-scrollbar::-webkit-scrollbar{display:none;width:0;height:0}
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      data-theme="dark"
      suppressHydrationWarning
      className={`${roboto.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      {/* These live at the top of <body>, not in a hand-rolled <head>. Browser
          extensions (ad blockers) inject their own <script>/<style> into <head>
          before React hydrates, and React then reconciles ours against theirs —
          producing a spurious hydration mismatch. The theme script still runs
          before any body content paints, so there's no flash. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: scrollbarCss }} />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
