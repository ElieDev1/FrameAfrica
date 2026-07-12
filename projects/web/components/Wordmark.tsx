import Image from 'next/image';
import logoDark from '@/public/brand/logo.png';
import logoLight from '@/public/brand/logo-light.png';

/**
 * The real Frame Africa logo (Africa + camera-aperture mark, "Frame Africa"
 * wordmark, "NEWS. VIEWS. AFRICA." tagline). Two art files ship: the full-colour
 * mark for the dark canvas and a light-background variant. Which one shows is
 * driven by `data-theme` on <html> (see globals.css) — the theme is resolved
 * before paint, so there's no flash.
 */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const h = size === 'sm' ? 26 : 34;
  const w = Math.round((h * 800) / 240);
  return (
    <span className="inline-flex items-center" aria-label="Frame Africa">
      <Image
        src={logoDark}
        alt="Frame Africa"
        height={h}
        width={w}
        priority
        className="brand-logo brand-logo-dark"
        style={{ width: 'auto', height: 'auto' }}
      />
      <Image
        src={logoLight}
        alt="Frame Africa"
        height={h}
        width={w}
        priority
        className="brand-logo brand-logo-light"
        style={{ width: 'auto', height: 'auto' }}
      />
    </span>
  );
}
