'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useT } from '@/components/LocaleProvider';
import { PUBLIC_API_URL } from '@/lib/ads';
import { publishAdCreative } from '@/lib/ad-studio-actions';
import { createHouseAd } from '@/lib/ads-actions';

/** IAB canvas sizes per placement (px). */
const SIZES = {
  flyer: { w: 1600, h: 400, label: 'Homepage flyer', dim: '1600×400' },
  leaderboard: { w: 970, h: 90, label: 'Leaderboard', dim: '970×90' },
  billboard: { w: 970, h: 250, label: 'Billboard', dim: '970×250' },
  rectangle: { w: 300, h: 250, label: 'Rectangle', dim: '300×250' },
  halfpage: { w: 300, h: 600, label: 'Half page', dim: '300×600' },
  native: { w: 1200, h: 675, label: 'Native', dim: '1200×675' },
} as const;
type Placement = keyof typeof SIZES;

type Align = 'top' | 'center' | 'bottom';
type FontChoice = 'sans' | 'serif';

interface Design {
  placement: Placement;
  headline: string;
  subline: string;
  cta: string;
  bg: string;
  fg: string;
  accent: string;
  font: FontChoice;
  align: Align;
  showLogo: boolean;
  showCta: boolean;
  darken: number;
}

interface MediaItem {
  id: string;
  url: string;
  alt: string | null;
}

/** Named starting points — a real template gallery, like the newsroom Studio. */
const TEMPLATES: { name: string; hint: string; patch: Partial<Design> }[] = [
  {
    name: 'Finance',
    hint: 'Dark, confident',
    patch: {
      bg: '#0b1f2a',
      fg: '#ffffff',
      accent: '#f39200',
      headline: 'Bank smarter, every day',
      subline: 'Open an account in minutes.',
      cta: 'Get started',
      font: 'sans',
      align: 'center',
    },
  },
  {
    name: 'Retail',
    hint: 'Bright, punchy',
    patch: {
      bg: '#f39200',
      fg: '#0b0b0b',
      accent: '#0b0b0b',
      headline: 'Big season sale — up to 50% off',
      subline: 'This week only, in-store & online.',
      cta: 'Shop now',
      font: 'sans',
      align: 'center',
    },
  },
  {
    name: 'Event',
    hint: 'Photo-led',
    patch: {
      bg: '#161616',
      fg: '#ffffff',
      accent: '#ffc20e',
      headline: 'Kigali Tech Summit 2026',
      subline: 'Two days. One hundred speakers.',
      cta: 'Register',
      font: 'sans',
      align: 'bottom',
      darken: 55,
    },
  },
  {
    name: 'Notice',
    hint: 'Formal, serif',
    patch: {
      bg: '#faf8f4',
      fg: '#0b0b0b',
      accent: '#e2231a',
      headline: 'Public tender: road maintenance',
      subline: 'Submissions close 30 June 2026.',
      cta: 'View details',
      font: 'serif',
      align: 'center',
    },
  },
  {
    name: 'Minimal',
    hint: 'Clean, editorial',
    patch: {
      bg: '#ffffff',
      fg: '#0b0b0b',
      accent: '#2e7d32',
      headline: 'Grow with the continent',
      subline: 'Partner with Frame Africa.',
      cta: 'Learn more',
      font: 'serif',
      align: 'center',
    },
  },
];

const SWATCHES = [
  '#0b0b0b',
  '#161616',
  '#0b1f2a',
  '#f39200',
  '#ffc20e',
  '#e2231a',
  '#2e7d32',
  '#faf8f4',
  '#ffffff',
];

const FONTS: Record<FontChoice, string> = {
  sans: 'Roboto, system-ui, "Segoe UI", sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
};

export function AdStudio({ media }: { media: MediaItem[] }) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [d, setD] = useState<Design>({
    placement: 'billboard',
    headline: 'Bank smarter, every day',
    subline: 'Open an account in minutes.',
    cta: 'Get started',
    bg: '#0b1f2a',
    fg: '#ffffff',
    accent: '#f39200',
    font: 'sans',
    align: 'center',
    showLogo: true,
    showCta: true,
    darken: 45,
    ...TEMPLATES[0].patch,
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Video / GIF ad mode
  const [mode, setMode] = useState<'design' | 'video'>('design');
  const [vUrl, setVUrl] = useState('');
  const [vTitle, setVTitle] = useState('');
  const [vLink, setVLink] = useState('');
  const [vPlacement, setVPlacement] = useState<Placement>('billboard');
  const [vMessage, setVMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [vPending, startVideo] = useTransition();

  function publishVideo() {
    setVMessage(null);
    startVideo(async () => {
      const res = await createHouseAd({
        title: vTitle,
        linkUrl: vLink,
        imageUrl: vUrl,
        placement: vPlacement,
      });
      setVMessage(
        res.ok
          ? { ok: true, text: 'Published — the motion ad is now serving in that slot.' }
          : { ok: false, text: res.error ?? 'Something went wrong.' },
      );
    });
  }

  const set = <K extends keyof Design>(k: K, v: Design[K]) => setD((p) => ({ ...p, [k]: v }));
  const applyTemplate = (patch: Partial<Design>) => setD((p) => ({ ...p, ...patch }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = SIZES[d.placement];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (image?: HTMLImageElement) => draw(ctx, d, w, h, image);

    if (photo) {
      const img = new Image();
      img.onload = () => render(img);
      img.src = photo;
    } else {
      render();
    }
  }, [d, photo]);

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.readAsDataURL(file);
  }

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frame-africa-ad-${d.placement}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function publish() {
    setMessage(null);
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const fd = new FormData();
      fd.append('file', blob, 'ad-creative.png');
      fd.append('title', title || d.headline);
      fd.append('linkUrl', linkUrl);
      fd.append('placement', d.placement);
      startTransition(async () => {
        const res = await publishAdCreative(fd);
        setMessage(
          res.ok
            ? { ok: true, text: 'Published — it is now serving in that slot.' }
            : { ok: false, text: res.error ?? 'Something went wrong.' },
        );
      });
    }, 'image/png');
  }

  const { dim, label } = SIZES[d.placement];
  const isVid = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(vUrl);

  return (
    <>
      {/* Mode switch: static designer vs a motion (video / GIF) ad */}
      <div className="mt-6 inline-flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
        {(['design', 'video'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              mode === m ? 'bg-primary text-black' : 'text-muted hover:text-text'
            }`}
          >
            {m === 'design' ? 'Design creative' : 'Video · GIF'}
          </button>
        ))}
      </div>

      {mode === 'video' ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-surface-2 p-6">
            {vUrl ? (
              <div
                className="w-full max-w-2xl overflow-hidden rounded-lg shadow-lg ring-1 ring-border"
                style={{ aspectRatio: `${SIZES[vPlacement].w} / ${SIZES[vPlacement].h}` }}
              >
                {isVid ? (
                  <video
                    src={vUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary URL
                  <img src={vUrl} alt="Ad preview" className="h-full w-full object-cover" />
                )}
              </div>
            ) : (
              <p className="max-w-xs text-center font-body text-sm text-muted">
                Paste a hosted video (MP4/WebM) or animated GIF URL to preview it here at the slot
                size.
              </p>
            )}
          </div>

          <aside className="space-y-4">
            <Field label="Placement">
              <select
                value={vPlacement}
                onChange={(e) => setVPlacement(e.target.value as Placement)}
                className={inputCls}
              >
                {Object.entries(SIZES).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.label} — {s.dim}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Video / GIF URL">
              <input
                type="text"
                value={vUrl}
                onChange={(e) => setVUrl(e.target.value)}
                placeholder="https://…/ad.mp4  or  /uploads/…"
                className={inputCls}
              />
            </Field>
            <Field label="Ad title (internal)">
              <input
                value={vTitle}
                onChange={(e) => setVTitle(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Destination link">
              <input
                type="url"
                value={vLink}
                onChange={(e) => setVLink(e.target.value)}
                placeholder="https://advertiser.example"
                className={inputCls}
              />
            </Field>
            <p className="font-mono text-[10px] leading-relaxed text-faint">
              Motion ads autoplay muted and loop in the slot. Host the file anywhere public (S3, a
              CDN, the media library) and paste its URL.
            </p>
            <button
              type="button"
              onClick={publishVideo}
              disabled={vPending || !vUrl || !vTitle || !vLink}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-heading text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {vPending ? 'Publishing…' : 'Publish motion ad'}
            </button>
            {vMessage && (
              <p
                role="status"
                className={`font-mono text-[11px] ${vMessage.ok ? 'text-accent-green' : 'text-accent-red'}`}
              >
                {vMessage.text}
              </p>
            )}
          </aside>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* ---- Canvas stage ---- */}
          <div className="min-w-0">
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border bg-surface-2 p-6">
              {/* The canvas scales to fit the stage but keeps its exact aspect ratio. */}
              <canvas
                ref={canvasRef}
                className="max-h-[60vh] max-w-full rounded-lg shadow-lg ring-1 ring-border"
                style={{ aspectRatio: `${SIZES[d.placement].w} / ${SIZES[d.placement].h}` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                {label} · {dim}px
              </span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={download}
                className="rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted hover:border-primary hover:text-primary"
              >
                {t('das.downloadPng')}
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={pending || !linkUrl}
                className="rounded-lg bg-primary px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {pending ? 'Publishing…' : 'Publish as house ad'}
              </button>
            </div>
            {message && (
              <p
                role="status"
                className={`mt-2 font-mono text-[11px] ${message.ok ? 'text-accent-green' : 'text-accent-red'}`}
              >
                {message.text}
              </p>
            )}

            {/* ---- Template gallery ---- */}
            <div className="mt-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                {t('das.templates')}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTemplate(t.patch)}
                    className="group rounded-lg border border-border p-2 text-left transition hover:border-primary"
                  >
                    <span
                      className="block h-10 rounded"
                      style={{
                        background: t.patch.bg,
                        boxShadow: `inset 0 0 0 3px ${t.patch.accent}`,
                      }}
                    />
                    <span className="mt-1.5 block font-heading text-sm font-bold text-text">
                      {t.name}
                    </span>
                    <span className="block font-mono text-[10px] text-faint">{t.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Controls ---- */}
          <aside className="space-y-4">
            <Field label="Placement">
              <select
                value={d.placement}
                onChange={(e) => set('placement', e.target.value as Placement)}
                className={inputCls}
              >
                {Object.entries(SIZES).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.label} — {s.dim}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Headline">
              <textarea
                rows={2}
                value={d.headline}
                onChange={(e) => set('headline', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Subline">
              <input
                value={d.subline}
                onChange={(e) => set('subline', e.target.value)}
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Call to action">
                <input
                  value={d.cta}
                  onChange={(e) => set('cta', e.target.value)}
                  className={inputCls}
                  disabled={!d.showCta}
                />
              </Field>
              <Field label="Text position">
                <select
                  value={d.align}
                  onChange={(e) => set('align', e.target.value as Align)}
                  className={inputCls}
                >
                  <option value="top">{t('das.top')}</option>
                  <option value="center">{t('das.center')}</option>
                  <option value="bottom">{t('das.bottom')}</option>
                </select>
              </Field>
            </div>

            <Field label="Font">
              <div className="flex gap-2">
                {(['sans', 'serif'] as FontChoice[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set('font', f)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition ${
                      d.font === f
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted hover:text-text'
                    }`}
                    style={{ fontFamily: FONTS[f] }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Field>

            {/* Background photo: upload or pick from the library */}
            <Field label="Background photo">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] uppercase text-muted hover:text-text">
                  {t('d.common.upload')}
                  <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                </label>
                {media.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPicker((s) => !s)}
                    className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] uppercase text-muted hover:text-text"
                  >
                    Library
                  </button>
                )}
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] uppercase text-accent-red hover:bg-accent-red/10"
                  >
                    Remove
                  </button>
                )}
              </div>
              {showPicker && (
                <div className="mt-2 grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto rounded-lg border border-border p-2">
                  {media.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPhoto(`${PUBLIC_API_URL.replace(/\/v1$/, '')}${m.url}`);
                        setShowPicker(false);
                      }}
                      className="aspect-square overflow-hidden rounded ring-1 ring-border hover:ring-primary"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- media thumbnails */}
                      <img
                        src={`${PUBLIC_API_URL.replace(/\/v1$/, '')}${m.url}`}
                        alt={m.alt ?? ''}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              {photo && (
                <div className="mt-2">
                  <label className="font-mono text-[10px] uppercase text-faint">
                    Darken {d.darken}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={85}
                    value={d.darken}
                    onChange={(e) => set('darken', Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              )}
            </Field>

            <ColorRow label="Background" value={d.bg} onChange={(v) => set('bg', v)} />
            <ColorRow label="Text" value={d.fg} onChange={(v) => set('fg', v)} />
            <ColorRow label="Accent" value={d.accent} onChange={(v) => set('accent', v)} />

            <div className="flex flex-wrap gap-4">
              <Toggle
                label="Call to action"
                checked={d.showCta}
                onChange={(v) => set('showCta', v)}
              />
              <Toggle
                label="Frame Africa mark"
                checked={d.showLogo}
                onChange={(v) => set('showLogo', v)}
              />
            </div>

            <div className="border-t border-border pt-4">
              <Field label="Ad title (internal)">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={d.headline}
                  className={inputCls}
                />
              </Field>
              <Field label="Destination link">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://advertiser.example"
                  className={inputCls}
                />
              </Field>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ drawing */

function draw(
  ctx: CanvasRenderingContext2D,
  d: Design,
  w: number,
  h: number,
  photo?: HTMLImageElement,
) {
  const wide = w / h >= 3; // leaderboard
  const pad = Math.round(Math.min(w, h) * (wide ? 0.14 : 0.09)) + 6;
  const font = FONTS[d.font];

  // Background
  ctx.fillStyle = d.bg;
  ctx.fillRect(0, 0, w, h);
  if (photo) {
    const scale = Math.max(w / photo.width, h / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.fillStyle = `rgba(0,0,0,${d.darken / 100})`;
    ctx.fillRect(0, 0, w, h);
  }

  const contentW = w - pad * 2;

  // --- Auto-fit headline: shrink the font until every line fits (never truncate) ---
  const maxHeadPx = wide ? h * 0.42 : Math.min(w, h) * 0.15;
  let headPx = maxHeadPx;
  let lines: string[] = [];
  const headBudget = h * (wide ? 0.62 : d.showCta ? 0.44 : 0.5);
  for (; headPx > 10; headPx -= 1) {
    ctx.font = `800 ${headPx}px ${font}`;
    lines = wrap(ctx, d.headline, contentW);
    if (lines.length * headPx * 1.12 <= headBudget && lines.length <= (wide ? 2 : 4)) break;
  }
  const lineH = headPx * 1.12;

  const subPx = Math.round(headPx * (wide ? 0.34 : 0.4));
  ctx.font = `400 ${subPx}px ${font}`;
  const subLines = !wide && d.subline ? wrap(ctx, d.subline, contentW).slice(0, 2) : [];

  const ctaPx = Math.max(12, Math.round(headPx * (wide ? 0.42 : 0.36)));
  const ctaH = ctaPx * 2.1;

  // Total text block height for vertical alignment
  const blockH =
    lines.length * lineH +
    (subLines.length ? subLines.length * subPx * 1.25 + subPx * 0.4 : 0) +
    (d.showCta && !wide ? ctaH + subPx : 0);

  let y: number;
  if (d.align === 'top') y = pad + headPx;
  else if (d.align === 'bottom') y = h - pad - blockH + headPx;
  else y = (h - blockH) / 2 + headPx;

  // Headline
  ctx.fillStyle = d.fg;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `800 ${headPx}px ${font}`;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += lineH;
  }

  // Subline
  if (subLines.length) {
    y += subPx * 0.3;
    ctx.globalAlpha = 0.86;
    ctx.font = `400 ${subPx}px ${font}`;
    for (const line of subLines) {
      ctx.fillText(line, pad, y);
      y += subPx * 1.25;
    }
    ctx.globalAlpha = 1;
  }

  // CTA pill
  if (d.showCta && d.cta) {
    ctx.font = `700 ${ctaPx}px ${font}`;
    const tw = ctx.measureText(d.cta).width;
    const bw = tw + ctaPx * 1.7;
    // Wide banners put the CTA on the right, centred vertically.
    const bx = wide ? w - pad - bw : pad;
    const by = wide ? (h - ctaH) / 2 : y + subPx * 0.2;
    roundRect(ctx, bx, by, bw, ctaH, ctaH / 2);
    ctx.fillStyle = d.accent;
    ctx.fill();
    ctx.fillStyle = pickContrast(d.accent);
    ctx.textBaseline = 'middle';
    ctx.fillText(d.cta, bx + ctaPx * 0.85, by + ctaH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  // Brand mark (bottom-right)
  if (d.showLogo) {
    const mark = 'FRAME AFRICA';
    const markPx = Math.max(10, Math.round(h * (wide ? 0.14 : 0.05)));
    ctx.font = `800 ${markPx}px ${FONTS.sans}`;
    ctx.fillStyle = d.fg;
    ctx.globalAlpha = 0.7;
    ctx.textAlign = 'right';
    ctx.fillText(mark, w - pad, h - pad * 0.7);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // Accent rule along the bottom for a finished, branded feel
  ctx.fillStyle = d.accent;
  ctx.fillRect(0, h - Math.max(3, h * 0.012), w, Math.max(3, h * 0.012));
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function pickContrast(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#000000';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.55 ? '#000000' : '#ffffff';
}

/* ------------------------------------------------------------------ inputs */

const inputCls =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-text outline-none focus:border-primary disabled:opacity-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary"
      />
      {label}
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-surface"
          aria-label={`${label} colour`}
        />
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`${label} ${c}`}
            style={{ background: c }}
            className={`h-6 w-6 rounded-full ring-1 ${value.toLowerCase() === c ? 'ring-2 ring-primary' : 'ring-border'}`}
          />
        ))}
      </div>
    </div>
  );
}
