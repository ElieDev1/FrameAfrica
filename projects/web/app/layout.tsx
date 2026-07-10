import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Mono, Inter, Source_Serif_4 } from 'next/font/google';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { getLocale } from '@/lib/i18n-server';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import './globals.css';

// Headlines — an elegant editorial serif display.
const heading = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
});

// UI / base — a clean, highly legible sans for nav, buttons, chrome.
const sans = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Article body — a comfortable reading serif.
const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  weight: ['400', '600'],
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
      className={`${heading.variable} ${sans.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: scrollbarCss }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
