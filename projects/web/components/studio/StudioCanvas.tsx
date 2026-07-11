'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/components/LocaleProvider';

/**
 * Frame Africa Flyer Studio — an advanced in-app flyer / social-card maker
 * (documents/13 §6). Prefill from a published story or start from a preset,
 * then customise everything: photo + overlay style, a readability backdrop
 * (scrim) and drop shadow behind the text, where the text sits, colours, a CTA
 * pill, the logo, and a designed social-media bar (icons + handle). Exports a
 * PNG. Pure client, no backend.
 */

export interface StudioArticle {
  title: string;
  section: string;
  author: string;
  imageUrl: string | null;
}

type SizeKey = 'square' | 'story' | 'post' | 'wide' | 'flyer';

const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: 'Square 1:1' },
  post: { w: 1080, h: 1350, label: 'Portrait 4:5' },
  story: { w: 1080, h: 1920, label: 'Story 9:16' },
  wide: { w: 1200, h: 675, label: 'Wide 16:9' },
  flyer: { w: 1240, h: 1754, label: 'Flyer A4' },
};

const SWATCHES = ['#ffffff', '#0b0b0b', '#f39200', '#ffc20e', '#e2231a', '#2e7d32'] as const;

const PLATFORMS = ['instagram', 'x', 'facebook', 'youtube', 'linkedin', 'whatsapp'] as const;
type Platform = (typeof PLATFORMS)[number];
const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  x: 'X',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
};

interface Design {
  size: SizeKey;
  bgColor: string;
  textColor: string;
  accentColor: string;
  overlay: number; // photo scrim strength 0..100
  overlayStyle: 'gradient' | 'full' | 'none';
  scrim: number; // 0..100 opacity of a panel behind the text block
  scrimColor: string;
  textShadow: boolean;
  headlineScale: number; // 0.6..1.6
  align: 'left' | 'center';
  vPosition: 'top' | 'middle' | 'bottom';
  showLogo: boolean;
  quotes: boolean;
  kicker: string;
  headline: string;
  source: string;
  cta: string;
  handle: string;
  socials: Record<Platform, boolean>;
  footer: string;
}

const PRESETS: { label: string; patch: Partial<Design> }[] = [
  {
    label: 'Cinematic',
    patch: {
      bgColor: '#0b0b0b',
      textColor: '#ffffff',
      accentColor: '#f39200',
      overlay: 70,
      overlayStyle: 'gradient',
      scrim: 0,
      textShadow: true,
      vPosition: 'bottom',
    },
  },
  {
    label: 'Breaking',
    patch: {
      bgColor: '#e2231a',
      textColor: '#ffffff',
      accentColor: '#ffffff',
      overlay: 55,
      overlayStyle: 'full',
      scrim: 0,
      textShadow: false,
      vPosition: 'middle',
    },
  },
  {
    label: 'Panel',
    patch: {
      textColor: '#ffffff',
      accentColor: '#f39200',
      overlay: 30,
      overlayStyle: 'none',
      scrim: 46,
      scrimColor: '#0b0b0b',
      textShadow: false,
      vPosition: 'bottom',
    },
  },
  {
    label: 'Light',
    patch: {
      bgColor: '#faf8f4',
      textColor: '#0b0b0b',
      accentColor: '#f39200',
      overlay: 40,
      overlayStyle: 'gradient',
      scrim: 0,
      textShadow: false,
      vPosition: 'bottom',
    },
  },
];

function loaded(img: HTMLImageElement | null): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

function isDark(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
}

function rgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(0,0,0,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

const SANS = 'system-ui, "Segoe UI", Roboto, sans-serif';

/** One social mark inside a rounded-square badge, drawn in `color`. */
function drawSocial(
  ctx: CanvasRenderingContext2D,
  p: Platform,
  x: number,
  y: number,
  s: number,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1, s * 0.07);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  rr(ctx, x, y, s, s, s * 0.24);
  ctx.stroke();
  const cx = x + s / 2;
  const cy = y + s / 2;

  if (p === 'instagram') {
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s * 0.74, y + s * 0.26, s * 0.055, 0, Math.PI * 2);
    ctx.fill();
  } else if (p === 'x') {
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y + s * 0.3);
    ctx.lineTo(x + s * 0.7, y + s * 0.7);
    ctx.moveTo(x + s * 0.7, y + s * 0.3);
    ctx.lineTo(x + s * 0.3, y + s * 0.7);
    ctx.stroke();
  } else if (p === 'youtube') {
    ctx.beginPath();
    ctx.moveTo(x + s * 0.42, y + s * 0.36);
    ctx.lineTo(x + s * 0.42, y + s * 0.64);
    ctx.lineTo(x + s * 0.66, y + s * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (p === 'whatsapp') {
    // handset: a rotated capsule
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    rr(ctx, -s * 0.05, -s * 0.2, s * 0.1, s * 0.4, s * 0.05);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.09, 0, Math.PI * 2);
    ctx.arc(0, s * 0.2, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // facebook 'f', linkedin 'in'
    ctx.font = `800 ${s * (p === 'facebook' ? 0.62 : 0.42)}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p === 'facebook' ? 'f' : 'in', cx, cy + s * 0.02);
  }
  ctx.restore();
}

function draw(
  ctx: CanvasRenderingContext2D,
  d: Design,
  photo: HTMLImageElement | null,
  logoDark: HTMLImageElement | null,
  logoLight: HTMLImageElement | null,
) {
  const { w, h } = SIZES[d.size];
  const pad = w * 0.075;
  const centre = d.align === 'center';
  const x = centre ? w / 2 : pad;

  // ---- Background: colour, or the photo under an overlay ----
  ctx.fillStyle = d.bgColor;
  ctx.fillRect(0, 0, w, h);
  if (photo) {
    drawCover(ctx, photo, w, h);
    const a = d.overlay / 100;
    if (d.overlayStyle === 'full') {
      ctx.fillStyle = `rgba(11,11,11,${a})`;
      ctx.fillRect(0, 0, w, h);
    } else if (d.overlayStyle === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgba(11,11,11,${a * 0.35})`);
      g.addColorStop(0.5, `rgba(11,11,11,${a * 0.6})`);
      g.addColorStop(1, `rgba(11,11,11,${Math.min(1, a * 1.15)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // ---- Brand logo (top) ----
  if (d.showLogo) {
    const dark = Boolean(photo) || isDark(d.bgColor);
    const logo = dark ? logoDark : logoLight;
    if (loaded(logo)) {
      const logoH = w * 0.052;
      const logoW = logoH * (logo.naturalWidth / logo.naturalHeight);
      ctx.drawImage(logo, centre ? (w - logoW) / 2 : pad, pad, logoW, logoH);
    } else {
      ctx.fillStyle = d.textColor;
      ctx.textAlign = centre ? 'center' : 'left';
      ctx.textBaseline = 'top';
      ctx.font = `800 ${w * 0.032}px ${SANS}`;
      ctx.fillText('FRAME AFRICA', x, pad);
    }
  }

  // ---- Bottom chrome metrics (socials + footer) ----
  const enabled = PLATFORMS.filter((p) => d.socials[p]);
  const hasSocials = enabled.length > 0 || d.handle.trim().length > 0;
  const footerH = pad * 1.05;
  const socialH = hasSocials ? w * 0.09 : 0;
  const bottomChrome = footerH + socialH;

  // ---- Text block metrics ----
  const headSize = w * 0.076 * d.headlineScale;
  const lineH = headSize * 1.14;
  ctx.font = `800 ${headSize}px ${SANS}`;
  const body = d.quotes ? `“${d.headline}”` : d.headline;
  const lines = wrapText(ctx, body || 'Your headline here', w - pad * 2);
  const kickerH = d.kicker.trim() ? w * 0.055 : 0;
  const sourceH = d.source.trim() ? w * 0.05 : 0;
  const ctaH = d.cta.trim() ? w * 0.075 : 0;
  const blockH = kickerH + lines.length * lineH + sourceH + ctaH;

  let top: number;
  if (d.vPosition === 'top') top = pad + (d.showLogo ? w * 0.1 : 0);
  else if (d.vPosition === 'middle') top = Math.max(pad, (h - blockH) / 2);
  else top = h - bottomChrome - pad * 0.6 - blockH;

  // ---- Readability scrim behind the text block ----
  if (d.scrim > 0) {
    const by = top - pad * 0.55;
    const bh = blockH + pad * 0.9;
    ctx.fillStyle = rgba(d.scrimColor, d.scrim / 100);
    rr(ctx, pad * 0.4, by, w - pad * 0.8, bh, w * 0.03);
    ctx.fill();
  }

  // ---- Text ----
  ctx.textAlign = centre ? 'center' : 'left';
  ctx.textBaseline = 'top';
  let y = top;

  if (d.kicker.trim()) {
    ctx.fillStyle = d.accentColor;
    ctx.font = `800 ${w * 0.028}px ${SANS}`;
    ctx.fillText(d.kicker.toUpperCase(), x, y);
    y += kickerH;
  }

  if (d.textShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = headSize * 0.16;
    ctx.shadowOffsetY = headSize * 0.05;
  }
  ctx.fillStyle = d.textColor;
  ctx.font = `800 ${headSize}px ${SANS}`;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineH;
  }
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (d.source.trim()) {
    ctx.fillStyle = d.accentColor;
    ctx.font = `700 ${w * 0.024}px ${SANS}`;
    ctx.fillText((d.quotes ? '— ' : '') + d.source, x, y + w * 0.006);
    y += sourceH;
  }

  // ---- CTA pill ----
  if (d.cta.trim()) {
    const ctaFont = w * 0.026;
    ctx.font = `800 ${ctaFont}px ${SANS}`;
    const tw = ctx.measureText(d.cta.toUpperCase()).width;
    const ph = w * 0.058;
    const pw = tw + w * 0.06;
    const px = centre ? w / 2 - pw / 2 : pad;
    const py = y + w * 0.008;
    ctx.fillStyle = d.accentColor;
    rr(ctx, px, py, pw, ph, ph / 2);
    ctx.fill();
    ctx.fillStyle = isDark(d.accentColor) ? '#ffffff' : '#0b0b0b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.cta.toUpperCase(), px + pw / 2, py + ph / 2 + ph * 0.03);
  }

  // ---- Social bar ----
  if (hasSocials) {
    const s = w * 0.05;
    const gap = w * 0.02;
    const handle = d.handle.trim();
    ctx.font = `700 ${w * 0.026}px ${SANS}`;
    const handleW = handle ? ctx.measureText(handle).width + gap : 0;
    const rowW = enabled.length * s + Math.max(0, enabled.length - 1) * gap + handleW;
    const rowY = h - footerH - socialH + (socialH - s) / 2;
    let sx = centre ? (w - rowW) / 2 : pad;
    for (const p of enabled) {
      drawSocial(ctx, p, sx, rowY, s, d.textColor);
      sx += s + gap;
    }
    if (handle) {
      ctx.fillStyle = d.textColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${w * 0.026}px ${SANS}`;
      ctx.fillText(handle, sx, rowY + s / 2 + w * 0.002);
    }
  }

  // ---- Footer rule + text ----
  ctx.fillStyle = d.accentColor;
  ctx.fillRect(0, h - footerH * 0.75, w, w * 0.011);
  if (d.footer.trim()) {
    ctx.fillStyle = d.textColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `700 ${w * 0.02}px ${SANS}`;
    ctx.fillText(d.footer, pad, h - footerH * 0.3);
  }
}

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-muted';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`colour ${c}`}
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full border-2 transition ${
            value.toLowerCase() === c ? 'border-primary' : 'border-border'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('dsc.customColour')}
        className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
      />
    </div>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            value === o.value ? 'bg-primary text-black' : 'text-muted hover:text-text'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StudioCanvas({ articles }: { articles: StudioArticle[] }) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const logoDarkRef = useRef<HTMLImageElement | null>(null);
  const logoLightRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(0);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [design, setDesign] = useState<Design>({
    size: 'square',
    bgColor: '#0b0b0b',
    textColor: '#ffffff',
    accentColor: '#f39200',
    overlay: 68,
    overlayStyle: 'gradient',
    scrim: 0,
    scrimColor: '#0b0b0b',
    textShadow: true,
    headlineScale: 1,
    align: 'left',
    vPosition: 'bottom',
    showLogo: true,
    quotes: false,
    kicker: 'Business',
    headline: 'Rwanda coffee exports hit a record high',
    source: 'Frame Africa',
    cta: 'Read more',
    handle: '@frameafrica',
    socials: {
      instagram: true,
      x: true,
      facebook: true,
      youtube: false,
      linkedin: false,
      whatsapp: true,
    },
    footer: 'frameafrica.rw',
  });

  useEffect(() => {
    const bump = () => setReady((n) => n + 1);
    const dark = new Image();
    dark.onload = bump;
    dark.src = '/brand/logo.png';
    logoDarkRef.current = dark;
    const light = new Image();
    light.onload = bump;
    light.src = '/brand/logo-light.png';
    logoLightRef.current = light;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = SIZES[design.size];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx, design, photoRef.current, logoDarkRef.current, logoLightRef.current);
  }, [design, ready, hasPhoto]);

  const set = (patch: Partial<Design>) => setDesign((d) => ({ ...d, ...patch }));
  const toggleSocial = (p: Platform) =>
    setDesign((d) => ({ ...d, socials: { ...d.socials, [p]: !d.socials[p] } }));

  function setPhotoFromUrl(url: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      photoRef.current = img;
      setHasPhoto(true);
      setReady((n) => n + 1);
    };
    img.src = url;
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        photoRef.current = img;
        setHasPhoto(true);
        setReady((n) => n + 1);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    photoRef.current = null;
    setHasPhoto(false);
    setReady((n) => n + 1);
  }

  function prefill(index: number) {
    const a = articles[index];
    if (!a) return;
    set({ kicker: a.section, headline: a.title, source: a.author });
    if (a.imageUrl) setPhotoFromUrl(a.imageUrl);
  }

  function download() {
    setExportError(false);
    try {
      canvasRef.current?.toBlob((blob) => {
        if (!blob) {
          setExportError(true);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frame-africa-${design.size}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch {
      setExportError(true);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem] xl:grid-cols-[1fr_26rem]">
      {/* Preview */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-start justify-center rounded-2xl border border-border bg-surface p-6">
          <canvas
            ref={canvasRef}
            className="h-auto w-full rounded-lg shadow-2xl"
            style={{ maxWidth: design.size === 'story' || design.size === 'flyer' ? 340 : 520 }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(SIZES) as SizeKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => set({ size: k })}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                design.size === k
                  ? 'border-primary bg-primary/12 text-primary'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              {SIZES[k].label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex max-h-[82vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => set(p.patch)}
              className="rounded-lg border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted hover:border-primary hover:text-primary"
            >
              {p.label}
            </button>
          ))}
        </div>

        <Section title="Content">
          {articles.length > 0 && (
            <label className="flex flex-col gap-1">
              <span className={label}>{t('dsc.startFromStory')}</span>
              <select
                defaultValue=""
                onChange={(e) => e.target.value !== '' && prefill(Number(e.target.value))}
                className={input}
              >
                <option value="">{t('dsc.choosePublished')}</option>
                {articles.map((a, i) => (
                  <option key={i} value={i}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className={label}>{t('dsc.kicker')}</span>
            <input
              value={design.kicker}
              onChange={(e) => set({ kicker: e.target.value })}
              maxLength={40}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>{t('dsc.headline')}</span>
            <textarea
              value={design.headline}
              onChange={(e) => set({ headline: e.target.value })}
              maxLength={200}
              rows={3}
              className={input}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={label}>{t('dsc.source')}</span>
              <input
                value={design.source}
                onChange={(e) => set({ source: e.target.value })}
                maxLength={60}
                className={input}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={label}>{t('dsc.ctaPill')}</span>
              <input
                value={design.cta}
                onChange={(e) => set({ cta: e.target.value })}
                maxLength={30}
                placeholder={t('dsc.ctaPlaceholder')}
                className={input}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 font-body text-xs text-muted">
            <input
              type="checkbox"
              checked={design.quotes}
              onChange={(e) => set({ quotes: e.target.checked })}
            />
            Wrap the headline in quote marks
          </label>
        </Section>

        <Section title="Photo & overlay">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={onPickImage}
              className="min-w-0 flex-1 font-body text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-primary/15 file:px-2.5 file:py-1.5 file:font-mono file:text-[11px] file:text-primary"
            />
            {hasPhoto && (
              <button
                type="button"
                onClick={removeImage}
                className="shrink-0 rounded border border-border px-2 py-1 font-mono text-[11px] text-muted hover:border-accent-red hover:text-accent-red"
              >
                Remove
              </button>
            )}
          </div>
          {hasPhoto ? (
            <>
              <div className="flex flex-col gap-1">
                <span className={label}>{t('dsc.overlayStyle')}</span>
                <Seg
                  value={design.overlayStyle}
                  onChange={(v) => set({ overlayStyle: v })}
                  options={[
                    { value: 'gradient', label: 'Gradient' },
                    { value: 'full', label: 'Full' },
                    { value: 'none', label: 'None' },
                  ]}
                />
              </div>
              <label className="flex flex-col gap-1">
                <span className={label}>Photo darkening ({design.overlay}%)</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={design.overlay}
                  onChange={(e) => set({ overlay: Number(e.target.value) })}
                  className="accent-primary"
                />
              </label>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className={label}>{t('dsc.backgroundColour')}</span>
              <ColorField value={design.bgColor} onChange={(c) => set({ bgColor: c })} />
            </div>
          )}
        </Section>

        <Section title="Text style & position">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className={label}>{t('dsc.align')}</span>
              <Seg
                value={design.align}
                onChange={(v) => set({ align: v })}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Centre' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className={label}>{t('dsc.position')}</span>
              <Seg
                value={design.vPosition}
                onChange={(v) => set({ vPosition: v })}
                options={[
                  { value: 'top', label: 'Top' },
                  { value: 'middle', label: 'Mid' },
                  { value: 'bottom', label: 'Btm' },
                ]}
              />
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className={label}>Headline size ({design.headlineScale.toFixed(2)}×)</span>
            <input
              type="range"
              min={0.6}
              max={1.6}
              step={0.05}
              value={design.headlineScale}
              onChange={(e) => set({ headlineScale: Number(e.target.value) })}
              className="accent-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Text backdrop ({design.scrim}%)</span>
            <input
              type="range"
              min={0}
              max={100}
              value={design.scrim}
              onChange={(e) => set({ scrim: Number(e.target.value) })}
              className="accent-primary"
            />
          </label>
          {design.scrim > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className={label}>{t('dsc.backdropColour')}</span>
              <ColorField value={design.scrimColor} onChange={(c) => set({ scrimColor: c })} />
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 font-body text-xs text-muted">
              <input
                type="checkbox"
                checked={design.textShadow}
                onChange={(e) => set({ textShadow: e.target.checked })}
              />
              Drop shadow behind text
            </label>
            <label className="flex items-center gap-2 font-body text-xs text-muted">
              <input
                type="checkbox"
                checked={design.showLogo}
                onChange={(e) => set({ showLogo: e.target.checked })}
              />
              Show logo
            </label>
          </div>
        </Section>

        <Section title="Colours">
          <div className="flex flex-col gap-1.5">
            <span className={label}>{t('dsc.text')}</span>
            <ColorField value={design.textColor} onChange={(c) => set({ textColor: c })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label}>{t('dsc.accent')}</span>
            <ColorField value={design.accentColor} onChange={(c) => set({ accentColor: c })} />
          </div>
        </Section>

        <Section title="Socials & footer">
          <label className="flex flex-col gap-1">
            <span className={label}>{t('dsc.handle')}</span>
            <input
              value={design.handle}
              onChange={(e) => set({ handle: e.target.value })}
              maxLength={40}
              placeholder="@frameafrica"
              className={input}
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={label}>{t('dsc.showPlatforms')}</span>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleSocial(p)}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                    design.socials[p]
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border text-muted hover:text-text'
                  }`}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className={label}>Footer (website)</span>
            <input
              value={design.footer}
              onChange={(e) => set({ footer: e.target.value })}
              maxLength={60}
              className={input}
            />
          </label>
        </Section>

        {exportError && (
          <p role="alert" className="font-mono text-xs text-accent-red">
            That background image blocks export (cross-origin). Upload the photo instead.
          </p>
        )}

        <button
          type="button"
          onClick={download}
          className="sticky bottom-0 rounded-lg bg-primary px-4 py-2.5 font-heading font-bold text-black shadow-lg transition hover:opacity-90"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
