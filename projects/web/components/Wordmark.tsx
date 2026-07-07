import Image from 'next/image';

/** Aperture icon + FRAMEAFRICA wordmark (FRAME white, AFRICA orange). */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const px = size === 'sm' ? 24 : 28;
  const text = size === 'sm' ? 'text-base' : 'text-lg';
  return (
    <span className="flex items-center gap-2">
      <Image
        src="/brand/icon.png"
        alt=""
        width={px}
        height={px}
        priority
        style={{ height: px, width: px }}
      />
      <span className={`font-heading font-black uppercase tracking-tight text-text ${text}`}>
        Frame<span className="text-primary">Africa</span>
      </span>
    </span>
  );
}
