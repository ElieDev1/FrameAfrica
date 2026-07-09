import type { Metadata } from 'next';
import { Libre_Franklin, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/site';
import './globals.css';

// Heading / UI face — a clean, news-appropriate grotesk (keeps the same CSS var).
const heading = Libre_Franklin({
  variable: '--font-archivo',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${heading.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: scrollbarCss }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
