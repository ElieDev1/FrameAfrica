'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Frame Africa Studio — an in-app maker for social cards / flyers, so staff
 * produce branded graphics without external software (documents/13 §6). Renders
 * to an HTML canvas and exports a PNG. Supports a background photo (cover-fit
 * under a readability gradient), a chosen text colour, and the real brand logo.
 * Pure client, no backend.
 */

const BRAND = {
  primary: '#f39200',
  red: '#e2231a',
  ink: '#0b0b0b',
  paper: '#faf8f4',
  white: '#ffffff',
} as const;

type TemplateKey = 'headline' | 'breaking' | 'quote';
type SizeKey = 'square' | 'story' | 'wide';

const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  square: { w: 1080, h: 1080, label: 'Square 1:1' },
  story: { w: 1080, h: 1920, label: 'Story 9:16' },
  wide: { w: 1200, h: 675, label: 'Wide 16:9' },
};

const TEMPLATES: { key: TemplateKey; label: string }[] = [
  { key: 'headline', label: 'Headline' },
  { key: 'breaking', label: 'Breaking' },
  { key: 'quote', label: 'Quote' },
];

const SWATCHES = ['#ffffff', '#0b0b0b', '#f39200', '#ffc20e', '#e2231a'] as const;

interface Design {
  template: TemplateKey;
  size: SizeKey;
  kicker: string;
  headline: string;
  source: string;
  textColor: string;
}

function loaded(img: HTMLImageElement | null): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
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

/** Cover-fit an image into (0,0,w,h), centred (like CSS object-fit: cover). */
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
  logo: HTMLImageElement | null,
) {
  const { w, h } = SIZES[d.size];
  const pad = w * 0.08;
  const sans = 'system-ui, "Segoe UI", Roboto, sans-serif';

  const hasPhoto = Boolean(photo);
  const bg =
    d.template === 'breaking' ? BRAND.red : d.template === 'quote' ? BRAND.paper : BRAND.ink;
  const accent = d.template === 'breaking' && !hasPhoto ? BRAND.white : BRAND.primary;

  // Background: solid brand colour, or the uploaded photo under a legibility scrim.
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (photo) {
    drawCover(ctx, photo, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(11,11,11,0.35)');
    g.addColorStop(0.55, 'rgba(11,11,11,0.55)');
    g.addColorStop(1, 'rgba(11,11,11,0.92)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (d.template === 'headline') {
    const g = ctx.createRadialGradient(w, 0, 0, w, 0, w);
    g.addColorStop(0, 'rgba(243,146,0,0.22)');
    g.addColorStop(1, 'rgba(243,146,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Brand header: the real logo lockup.
  ctx.textBaseline = 'alphabetic';
  if (loaded(logo)) {
    const logoH = w * 0.055;
    const logoW = logoH * (logo.naturalWidth / logo.naturalHeight);
    ctx.drawImage(logo, pad, pad, logoW, logoH);
  } else {
    ctx.fillStyle = d.textColor;
    ctx.font = `800 ${w * 0.034}px ${sans}`;
    ctx.fillText('FRAME AFRICA', pad, pad + w * 0.03);
  }

  // Content anchored near the bottom (reads well over photos).
  const isQuote = d.template === 'quote';
  const headSize = w * (d.size === 'wide' ? 0.062 : isQuote ? 0.07 : 0.078);
  ctx.font = `${isQuote ? '700' : '800'} ${headSize}px ${sans}`;
  const text = isQuote ? `“${d.headline}”` : d.headline;
  const lines = wrapText(
    ctx,
    text || (isQuote ? 'Your quote here' : 'Your headline here'),
    w - pad * 2,
  );
  const lineH = headSize * 1.12;

  const sourceH = d.source.trim() ? w * 0.05 : 0;
  const kickerH = d.kicker.trim() ? w * 0.06 : 0;
  const blockH = kickerH + lines.length * lineH + sourceH;
  let y = h - pad * 1.3 - blockH + headSize;

  if (d.kicker.trim()) {
    ctx.fillStyle = accent;
    ctx.font = `800 ${w * 0.028}px ${sans}`;
    ctx.fillText(d.kicker.toUpperCase(), pad, y);
    y += kickerH;
  }

  ctx.font = `${isQuote ? '700' : '800'} ${headSize}px ${sans}`;
  ctx.fillStyle = d.textColor;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += lineH;
  }

  if (d.source.trim()) {
    y += w * 0.005;
    ctx.fillStyle = accent;
    ctx.font = `700 ${w * 0.024}px ${sans}`;
    ctx.fillText((isQuote ? '— ' : '') + d.source, pad, y);
  }

  // Footer bar.
  ctx.fillStyle = accent;
  ctx.fillRect(0, h - pad * 0.9, w, w * 0.012);
  ctx.fillStyle = d.textColor;
  ctx.font = `700 ${w * 0.02}px ${sans}`;
  ctx.fillText('frameafrica.rw', pad, h - pad * 0.35);
}

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

export function StudioCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const logoDarkRef = useRef<HTMLImageElement | null>(null);
  const logoLightRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(0); // bumps to trigger a redraw
  const [hasPhoto, setHasPhoto] = useState(false);
  const [design, setDesign] = useState<Design>({
    template: 'headline',
    size: 'square',
    kicker: 'Business',
    headline: 'Rwanda coffee exports hit a record high',
    source: 'Frame Africa',
    textColor: '#ffffff',
  });

  // Preload the real brand logo (dark-bg + light-bg variants) once.
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
    if (!ctx) return;
    // Light background with no photo → use the light-variant logo; else the dark one.
    const lightBg = design.template === 'quote' && !hasPhoto;
    const logo = lightBg ? logoLightRef.current : logoDarkRef.current;
    draw(ctx, design, photoRef.current, logo);
  }, [design, ready, hasPhoto]);

  const set = (patch: Partial<Design>) => setDesign((d) => ({ ...d, ...patch }));

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

  function download() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frame-africa-${design.template}-${design.size}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
      {/* Preview */}
      <div className="flex items-start justify-center rounded-2xl border border-border bg-surface p-6">
        <canvas
          ref={canvasRef}
          className="h-auto w-full rounded-lg shadow-2xl"
          style={{ maxWidth: design.size === 'story' ? 320 : 480 }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Template
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => set({ template: t.key })}
                className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition ${
                  design.template === t.key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Background photo
          </span>
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

        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Text colour
          </span>
          <div className="flex items-center gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Text colour ${c}`}
                onClick={() => set({ textColor: c })}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  design.textColor.toLowerCase() === c ? 'border-primary' : 'border-border'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={design.textColor}
              onChange={(e) => set({ textColor: e.target.value })}
              aria-label="Custom text colour"
              className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent"
            />
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Size</span>
          <select
            value={design.size}
            onChange={(e) => set({ size: e.target.value as SizeKey })}
            className={input}
          >
            {Object.entries(SIZES).map(([key, s]) => (
              <option key={key} value={key}>
                {s.label} · {s.w}×{s.h}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {design.template === 'breaking' ? 'Label' : 'Kicker'}
          </span>
          <input
            value={design.kicker}
            onChange={(e) => set({ kicker: e.target.value })}
            maxLength={40}
            className={input}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {design.template === 'quote' ? 'Quote' : 'Headline'}
          </span>
          <textarea
            value={design.headline}
            onChange={(e) => set({ headline: e.target.value })}
            maxLength={200}
            rows={3}
            className={input}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {design.template === 'quote' ? 'Attribution' : 'Source / credit'}
          </span>
          <input
            value={design.source}
            onChange={(e) => set({ source: e.target.value })}
            maxLength={60}
            className={input}
          />
        </label>

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
