'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Frame Africa Studio — a fully customisable in-app maker for social cards /
 * flyers (documents/13 §6). Prefill from a published story, or start from a
 * preset, then customise everything (colours, overlay, size, alignment, logo,
 * quote style, footer) and export a PNG. Pure client, no backend.
 */

export interface StudioArticle {
  title: string;
  section: string;
  author: string;
  imageUrl: string | null;
}

type SizeKey = 'square' | 'story' | 'wide';

const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: 'Square 1:1' },
  story: { w: 1080, h: 1920, label: 'Story 9:16' },
  wide: { w: 1200, h: 675, label: 'Wide 16:9' },
};

const SWATCHES = ['#ffffff', '#0b0b0b', '#f39200', '#ffc20e', '#e2231a', '#2e7d32'] as const;

interface Design {
  size: SizeKey;
  bgColor: string;
  textColor: string;
  accentColor: string;
  overlay: number; // 0..100 scrim over a photo
  headlineScale: number; // 0.6..1.5
  align: 'left' | 'center';
  showLogo: boolean;
  quotes: boolean;
  kicker: string;
  headline: string;
  source: string;
  footer: string;
}

const PRESETS: { label: string; patch: Partial<Design> }[] = [
  {
    label: 'Dark',
    patch: { bgColor: '#0b0b0b', textColor: '#ffffff', accentColor: '#f39200', overlay: 72 },
  },
  {
    label: 'Breaking',
    patch: { bgColor: '#e2231a', textColor: '#ffffff', accentColor: '#ffffff', overlay: 60 },
  },
  {
    label: 'Light',
    patch: { bgColor: '#faf8f4', textColor: '#0b0b0b', accentColor: '#f39200', overlay: 45 },
  },
];

function loaded(img: HTMLImageElement | null): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/** Rough perceived luminance of a #rrggbb colour → true when it's dark. */
function isDark(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55;
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

function draw(
  ctx: CanvasRenderingContext2D,
  d: Design,
  photo: HTMLImageElement | null,
  logoDark: HTMLImageElement | null,
  logoLight: HTMLImageElement | null,
) {
  const { w, h } = SIZES[d.size];
  const pad = w * 0.08;
  const sans = 'system-ui, "Segoe UI", Roboto, sans-serif';
  const centre = d.align === 'center';
  const x = centre ? w / 2 : pad;
  ctx.textAlign = centre ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';

  // Background: colour, or the photo under a scrim.
  ctx.fillStyle = d.bgColor;
  ctx.fillRect(0, 0, w, h);
  if (photo) {
    drawCover(ctx, photo, w, h);
    const a = d.overlay / 100;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `rgba(11,11,11,${a * 0.4})`);
    g.addColorStop(0.55, `rgba(11,11,11,${a * 0.7})`);
    g.addColorStop(1, `rgba(11,11,11,${Math.min(1, a * 1.15)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Brand logo (variant chosen for the effective background darkness).
  if (d.showLogo) {
    const dark = Boolean(photo) || isDark(d.bgColor);
    const logo = dark ? logoDark : logoLight;
    if (loaded(logo)) {
      const logoH = w * 0.055;
      const logoW = logoH * (logo.naturalWidth / logo.naturalHeight);
      ctx.drawImage(logo, centre ? (w - logoW) / 2 : pad, pad, logoW, logoH);
    } else {
      ctx.fillStyle = d.textColor;
      ctx.font = `800 ${w * 0.034}px ${sans}`;
      ctx.fillText('FRAME AFRICA', x, pad + w * 0.03);
    }
  }

  // Content, anchored near the bottom.
  const headSize = w * 0.078 * d.headlineScale;
  ctx.font = `800 ${headSize}px ${sans}`;
  const body = d.quotes ? `“${d.headline}”` : d.headline;
  const lines = wrapText(ctx, body || 'Your headline here', w - pad * 2);
  const lineH = headSize * 1.12;
  const kickerH = d.kicker.trim() ? w * 0.06 : 0;
  const sourceH = d.source.trim() ? w * 0.05 : 0;
  const blockH = kickerH + lines.length * lineH + sourceH;
  let y = h - pad * 1.3 - blockH + headSize;

  if (d.kicker.trim()) {
    ctx.fillStyle = d.accentColor;
    ctx.font = `800 ${w * 0.028}px ${sans}`;
    ctx.fillText(d.kicker.toUpperCase(), x, y);
    y += kickerH;
  }

  ctx.fillStyle = d.textColor;
  ctx.font = `800 ${headSize}px ${sans}`;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineH;
  }

  if (d.source.trim()) {
    y += w * 0.005;
    ctx.fillStyle = d.accentColor;
    ctx.font = `700 ${w * 0.024}px ${sans}`;
    ctx.fillText((d.quotes ? '— ' : '') + d.source, x, y);
  }

  // Footer.
  ctx.textAlign = 'left';
  ctx.fillStyle = d.accentColor;
  ctx.fillRect(0, h - pad * 0.9, w, w * 0.012);
  if (d.footer.trim()) {
    ctx.fillStyle = d.textColor;
    ctx.font = `700 ${w * 0.02}px ${sans}`;
    ctx.fillText(d.footer, pad, h - pad * 0.35);
  }
}

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-muted';

function ColorField({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2">
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
        aria-label="custom colour"
        className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent"
      />
    </div>
  );
}

export function StudioCanvas({ articles }: { articles: StudioArticle[] }) {
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
    overlay: 72,
    headlineScale: 1,
    align: 'left',
    showLogo: true,
    quotes: false,
    kicker: 'Business',
    headline: 'Rwanda coffee exports hit a record high',
    source: 'Frame Africa',
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

  function setPhotoFromUrl(url: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // keep the canvas exportable for CORS-enabled hosts
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
    <div className="grid gap-8 md:grid-cols-[1fr_22rem]">
      {/* Preview */}
      <div className="flex items-start justify-center rounded-2xl border border-border bg-surface p-6">
        <canvas
          ref={canvasRef}
          className="h-auto w-full rounded-lg shadow-2xl"
          style={{ maxWidth: design.size === 'story' ? 320 : 480 }}
        />
      </div>

      {/* Controls */}
      <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto pr-1">
        {articles.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className={label}>Start from a story</span>
            <select
              defaultValue=""
              onChange={(e) => e.target.value !== '' && prefill(Number(e.target.value))}
              className={input}
            >
              <option value="">Choose a published story…</option>
              {articles.map((a, i) => (
                <option key={i} value={i}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
        )}

        <div>
          <p className={`mb-1.5 ${label}`}>Preset</p>
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
        </div>

        <div className="flex flex-col gap-1">
          <span className={label}>Background photo</span>
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
        </div>

        {hasPhoto && (
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
        )}

        {!hasPhoto && (
          <div className="flex flex-col gap-1.5">
            <span className={label}>Background colour</span>
            <ColorField value={design.bgColor} onChange={(c) => set({ bgColor: c })} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className={label}>Text colour</span>
          <ColorField value={design.textColor} onChange={(c) => set({ textColor: c })} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={label}>Accent colour</span>
          <ColorField value={design.accentColor} onChange={(c) => set({ accentColor: c })} />
        </div>

        <label className="flex flex-col gap-1">
          <span className={label}>Headline size ({design.headlineScale.toFixed(2)}×)</span>
          <input
            type="range"
            min={0.6}
            max={1.5}
            step={0.05}
            value={design.headlineScale}
            onChange={(e) => set({ headlineScale: Number(e.target.value) })}
            className="accent-primary"
          />
        </label>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-1 flex-col gap-1">
            <span className={label}>Size</span>
            <select
              value={design.size}
              onChange={(e) => set({ size: e.target.value as SizeKey })}
              className={input}
            >
              {Object.entries(SIZES).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={label}>Align</span>
            <select
              value={design.align}
              onChange={(e) => set({ align: e.target.value as 'left' | 'center' })}
              className={input}
            >
              <option value="left">Left</option>
              <option value="center">Centre</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-body text-xs text-muted">
            <input
              type="checkbox"
              checked={design.showLogo}
              onChange={(e) => set({ showLogo: e.target.checked })}
            />
            Show logo
          </label>
          <label className="flex items-center gap-2 font-body text-xs text-muted">
            <input
              type="checkbox"
              checked={design.quotes}
              onChange={(e) => set({ quotes: e.target.checked })}
            />
            Quote marks
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className={label}>Kicker</span>
          <input
            value={design.kicker}
            onChange={(e) => set({ kicker: e.target.value })}
            maxLength={40}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Headline</span>
          <textarea
            value={design.headline}
            onChange={(e) => set({ headline: e.target.value })}
            maxLength={200}
            rows={3}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Source / attribution</span>
          <input
            value={design.source}
            onChange={(e) => set({ source: e.target.value })}
            maxLength={60}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={label}>Footer</span>
          <input
            value={design.footer}
            onChange={(e) => set({ footer: e.target.value })}
            maxLength={60}
            className={input}
          />
        </label>

        {exportError && (
          <p role="alert" className="font-mono text-xs text-accent-red">
            That background image blocks export (cross-origin). Upload the photo instead.
          </p>
        )}

        <button
          type="button"
          onClick={download}
          className="rounded-lg bg-primary px-4 py-2.5 font-heading font-bold text-black transition hover:opacity-90"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}
