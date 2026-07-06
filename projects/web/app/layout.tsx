import type { Metadata } from 'next';
import { Archivo, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const archivo = Archivo({
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
  title: 'Frame Africa — NEWS. VIEWS. AFRICA.',
  description:
    'A modern, AI-assisted digital newspaper platform for Rwanda and the wider African audience.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${sourceSerif.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-6 font-mono text-xs text-faint">
            © {new Date().getFullYear()} Frame Africa · News. Views. Africa.
          </div>
        </footer>
      </body>
    </html>
  );
}
