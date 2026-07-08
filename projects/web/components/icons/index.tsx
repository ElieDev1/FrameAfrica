import type { SVGProps } from 'react';

/**
 * Inline SVG icon set — zero dependencies, CSP-safe, theme-aware via
 * `currentColor`. UI icons are stroked (Lucide-style); brand marks are filled
 * (Simple Icons paths). Use `size` for square dimensions; pass `className` for
 * colour (e.g. `text-primary`).
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

function Stroke({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

function Filled({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
      {children}
    </svg>
  );
}

// ── UI icons ────────────────────────────────────────────────────────────────

export const HeartIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z" />
  </Stroke>
);
export const HeartFilledIcon = (p: IconProps) => (
  <Filled {...p}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.49 4.04 3 5.5l7 7Z" />
  </Filled>
);
export const BookmarkIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
  </Stroke>
);
export const BookmarkFilledIcon = (p: IconProps) => (
  <Filled {...p}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" />
  </Filled>
);
export const ShareIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Stroke>
);
export const LinkIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Stroke>
);
export const CommentIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Stroke>
);
export const FlagIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </Stroke>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m9 18 6-6-6-6" />
  </Stroke>
);
export const ArrowUpRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </Stroke>
);
export const PlayIcon = (p: IconProps) => (
  <Filled {...p}>
    <path d="M5 3v18l15-9L5 3Z" />
  </Filled>
);
export const CloseIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Stroke>
);
export const CheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Stroke>
);
export const TrendingUpIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
    <path d="M16 7h6v6" />
  </Stroke>
);
export const TrendingDownIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M22 17 13.5 8.5 8.5 13.5 2 7" />
    <path d="M16 17h6v-6" />
  </Stroke>
);
export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </Stroke>
);
export const EyeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Stroke>
);

// ── Weather icons (WMO code → icon) ───────────────────────────────────────────

const SunIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </Stroke>
);
const CloudSunIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 2v2M5.2 5.2l1.4 1.4M2 12h2M17.4 6.6l1.4-1.4" />
    <circle cx="9" cy="10" r="3" />
    <path d="M15 19.5a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.5 1.5A3.5 3.5 0 0 0 6 19.5Z" />
  </Stroke>
);
const CloudIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </Stroke>
);
const FogIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 9h13.5a4.5 4.5 0 1 0-4.36-5.65" />
    <path d="M16 17H7M20 21H10M18 13H5" />
  </Stroke>
);
const DrizzleIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
    <path d="M8 19v1M8 22v.5M12 19v1M12 22v.5M16 19v1M16 22v.5" />
  </Stroke>
);
const RainIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
    <path d="M8 19l-1 3M12 19l-1 3M16 19l-1 3" />
  </Stroke>
);
const SnowIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
    <path d="M8 20h.01M12 20h.01M16 20h.01M10 22h.01M14 22h.01" />
  </Stroke>
);
const ThunderIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" />
    <path d="m13 16-3 4h3l-2 3" />
  </Stroke>
);

/** Map a WMO weather code (Open-Meteo) to an icon + short label. */
export function weatherFromCode(code: number): {
  Icon: (p: IconProps) => React.ReactElement;
  label: string;
} {
  if (code === 0) return { Icon: SunIcon, label: 'Clear' };
  if (code === 1 || code === 2) return { Icon: CloudSunIcon, label: 'Partly cloudy' };
  if (code === 3) return { Icon: CloudIcon, label: 'Overcast' };
  if (code === 45 || code === 48) return { Icon: FogIcon, label: 'Fog' };
  if (code >= 51 && code <= 57) return { Icon: DrizzleIcon, label: 'Drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return { Icon: RainIcon, label: 'Rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { Icon: SnowIcon, label: 'Snow' };
  if (code >= 95) return { Icon: ThunderIcon, label: 'Thunderstorm' };
  return { Icon: CloudIcon, label: 'Cloudy' };
}

export function WeatherIcon({ code, ...p }: IconProps & { code: number }) {
  const { Icon } = weatherFromCode(code);
  return <Icon {...p} />;
}

// ── Brand icons (Simple Icons paths, filled) ──────────────────────────────────

const BRAND_PATHS: Record<string, string> = {
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  whatsapp:
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
};

export function BrandIcon({
  name,
  size = 20,
  ...rest
}: IconProps & { name: 'x' | 'facebook' | 'whatsapp' | 'linkedin' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
      <path d={BRAND_PATHS[name]} />
    </svg>
  );
}

export const MailIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Stroke>
);
