'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Frame Africa Studio — an in-app maker for social cards / flyers, so staff
 * produce branded graphics without external software (documents/13 §6). Renders
 * to an HTML canvas and exports a PNG. Pure client, no backend.
 */

const BRAND = {
  primary: '#f39200',
  red: '#e2231a',
  yellow: '#ffc20e',
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

interface Design {
  template: TemplateKey;
  size: SizeKey;
  kicker: string;
  headline: string;
  source: string;
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

/** Draw the aperture ring brand mark centred at (x, y). */
function apertureMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.strokeStyle = BRAND.primary;
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = BRAND.red;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw(ctx: CanvasRenderingContext2D, d: Design) {
  const { w, h } = SIZES[d.size];
  const pad = w * 0.08;
  const sans = 'system-ui, "Segoe UI", Roboto, sans-serif';

  const dark = d.template !== 'quote';
  const bg =
    d.template === 'breaking' ? BRAND.red : d.template === 'quote' ? BRAND.paper : BRAND.ink;
  const fg = dark ? BRAND.white : BRAND.ink;
  const accent = d.template === 'breaking' ? BRAND.white : BRAND.primary;

  // Background.
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  if (d.template === 'headline') {
    const g = ctx.createRadialGradient(w, 0, 0, w, 0, w);
    g.addColorStop(0, 'rgba(243,146,0,0.22)');
    g.addColorStop(1, 'rgba(243,146,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // Brand header.
  apertureMark(ctx, pad + 22, pad + 8, 22);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = fg;
  ctx.font = `800 ${w * 0.032}px ${sans}`;
  ctx.fillText('FRAME AFRICA', pad + 58, pad + 18);
  ctx.fillStyle = accent;
  ctx.font = `700 ${w * 0.017}px ${sans}`;
  ctx.fillText('N E W S .   V I E W S .   A F R I C A .', pad + 58, pad + 42);

  // Kicker.
  let y = h * (d.size === 'wide' ? 0.42 : 0.55);
  if (d.kicker.trim()) {
    ctx.fillStyle = accent;
    ctx.font = `800 ${w * 0.028}px ${sans}`;
    ctx.fillText(d.kicker.toUpperCase(), pad, y);
    y += w * 0.06;
  }

  // Headline (or quote).
  const isQuote = d.template === 'quote';
  const headSize = w * (d.size === 'wide' ? 0.062 : isQuote ? 0.07 : 0.078);
  ctx.font = `${isQuote ? '700' : '800'} ${headSize}px ${sans}`;
  ctx.fillStyle = fg;
  const text = isQuote ? `“${d.headline}”` : d.headline;
  const lines = wrapText(
    ctx,
    text || (isQuote ? 'Your quote here' : 'Your headline here'),
    w - pad * 2,
  );
  const lineH = headSize * 1.12;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += lineH;
  }

  // Source / attribution.
  if (d.source.trim()) {
    y += w * 0.02;
    ctx.fillStyle = accent;
    ctx.font = `700 ${w * 0.024}px ${sans}`;
    ctx.fillText((isQuote ? '— ' : '') + d.source, pad, y);
  }

  // Footer bar.
  ctx.fillStyle = accent;
  ctx.fillRect(0, h - pad * 0.9, w, w * 0.012);
  ctx.fillStyle = fg;
  ctx.font = `700 ${w * 0.02}px ${sans}`;
  ctx.fillText('frameafrica.rw', pad, h - pad * 0.35);
}

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

export function StudioCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [design, setDesign] = useState<Design>({
    template: 'headline',
    size: 'square',
    kicker: 'Business',
    headline: 'Rwanda coffee exports hit a record high',
    source: 'Frame Africa',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = SIZES[design.size];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx, design);
  }, [design]);

  const set = (patch: Partial<Design>) => setDesign((d) => ({ ...d, ...patch }));

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
