import Link from 'next/link';
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BarChartIcon,
  type IconProps,
  ImageIcon,
  PlayIcon,
} from '@/components/icons';
import { type Locale, t } from '@/lib/i18n';
import { MULTIMEDIA_HUBS } from '@/lib/multimedia';

const ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  '/videos': PlayIcon,
  '/galleries': ImageIcon,
  '/podcasts': ActivityIcon,
  '/interactives': BarChartIcon,
};

/** Cards linking to the four multimedia hubs — the Multimedia section's content. */
export function MultimediaHubs({ locale }: { locale: Locale }) {
  return (
    <div className="grid gap-5 pt-8 sm:grid-cols-2">
      {MULTIMEDIA_HUBS.map((hub) => {
        const Icon = ICONS[hub.href] ?? PlayIcon;
        return (
          <Link
            key={hub.href}
            href={hub.href}
            className="group border border-border bg-surface p-5 transition hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/15">
                <Icon size={18} />
              </span>
              <ArrowUpRightIcon
                size={16}
                className="text-faint transition-colors group-hover:text-primary"
              />
            </div>
            <h2 className="mt-3 font-heading text-xl font-black tracking-tight text-text group-hover:text-primary">
              {t(locale, hub.nameKey)}
            </h2>
            <p className="mt-1 font-body text-sm leading-relaxed text-muted">
              {t(locale, hub.descKey)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
