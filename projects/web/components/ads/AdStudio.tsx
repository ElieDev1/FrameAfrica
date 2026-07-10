'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { publishAdCreative } from '@/lib/ad-studio-actions';

/** IAB canvas sizes per placement (px). */
const SIZES = {
  leaderboard: { w: 970, h: 90, label: 'Leaderboard 970×90' },
  billboard: { w: 970, h: 250, label: 'Billboard 970×250' },
  rectangle: { w: 300, h: 250, label: 'Rectangle 300×250' },
  halfpage: { w: 300, h: 600, label: 'Half page 300×600' },
  native: { w: 1200, h: 675, label: 'Native 1200×675' },
} as const;

type Placement = keyof typeof SIZES;

const SWATCHES = ['#0a0a0a', '#161616', '#f39200', '#e2231a', '#2e7d32', '#faf8f4'];

export function AdStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [placement, setPlacement] = useState<Placement>('billboard');
  const [headline, setHeadline] = useState('Bank smarter, every day.');
  const [subline, setSubline] = useState('Open an account in minutes.');
  const [cta, setCta] = useState('Learn more');
  const [bg, setBg] = useState('#161616');
  const [fg, setFg] = useState('#ffffff');
  const [accent, setAccent] = useState('#f39200');
  const [showLogo, setShowLogo] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [darken, setDarken] = useState(45);

  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Redraw whenever any design input changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = SIZES[placement];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paint = (image?: HTMLImageElement) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      if (image) {
        // cover-fit
        const scale = Math.max(w / image.width, h / image.height);
        const dw = image.width * scale;
        const dh = image.height * scale;
        ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx.fillStyle = `rgba(0,0,0,${darken / 100})`;
        ctx.fillRect(0, 0, w, h);
      }

      const pad = Math.round(Math.min(w, h) * 0.08) + 8;
      const wide = w / h > 2; // leaderboard-ish
      const headSize = wide ? Math.round(h * 0.36) : Math.round(Math.min(w, h) * 0.13);

      ctx.fillStyle = fg;
      ctx.textBaseline = 'top';
      ctx.font = `700 ${headSize}px Georgia, "Source Serif 4", serif`;
      const lines = wrap(ctx, headline, w - pad * 2, wide ? 1 : 3);
      let y = pad;
      for (const line of lines) {
        ctx.fillText(line, pad, y);
        y += headSize * 1.12;
      }

      if (!wide && subline) {
        const subSize = Math.round(headSize * 0.42);
        ctx.font = `400 ${subSize}px Inter, system-ui, sans-serif`;
        ctx.globalAlpha = 0.85;
        for (const line of wrap(ctx, subline, w - pad * 2, 2)) {
          y += 6;
          ctx.fillText(line, pad, y);
          y += subSize * 1.2;
        }
        ctx.globalAlpha = 1;
      }

      // CTA pill (bottom-left), logo (bottom-right)
      if (cta) {
        const ctaSize = Math.max(12, Math.round(headSize * 0.34));
        ctx.font = `700 ${ctaSize}px Inter, system-ui, sans-serif`;
        const tw = ctx.measureText(cta).width;
        const bw = tw + ctaSize * 1.6;
        const bh = ctaSize * 2;
        const bx = pad;
        const by = h - pad - bh;
        ctx.fillStyle = accent;
        roundRect(ctx, bx, by, bw, bh, bh / 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.fillText(cta, bx + ctaSize * 0.8, by + bh / 2 - ctaSize * 0.6);
      }

      if (showLogo) {
        const logoSize = Math.max(10, Math.round(h * 0.06));
        ctx.font = `700 ${logoSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = fg;
        ctx.globalAlpha = 0.75;
        const label = 'FRAME AFRICA';
        const lw = ctx.measureText(label).width;
        ctx.fillText(label, w - pad - lw, h - pad - logoSize);
        ctx.globalAlpha = 1;
      }
    };

    if (photo) {
      const img = new Image();
      img.onload = () => paint(img);
      img.src = photo;
    } else {
      paint();
    }
  }, [placement, headline, subline, cta, bg, fg, accent, showLogo, photo, darken]);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
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
      a.download = `frame-africa-ad-${placement}.png`;
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
      fd.append('title', title || headline);
      fd.append('linkUrl', linkUrl);
      fd.append('placement', placement);
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

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Canvas preview */}
      <div className="min-w-0">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-4">
          <canvas ref={canvasRef} className="mx-auto block max-w-full rounded-lg" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-lg border border-border px-4 py-2 font-mono text-xs uppercase tracking-wide text-muted hover:border-primary hover:text-primary"
          >
            Download PNG
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
      </div>

      {/* Controls */}
      <aside className="space-y-4">
        <Field label="Placement">
          <select
            value={placement}
            onChange={(e) => setPlacement(e.target.value as Placement)}
            className={inputCls}
          >
            {Object.entries(SIZES).map(([key, s]) => (
              <option key={key} value={key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Headline">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Subline">
          <input
            value={subline}
            onChange={(e) => setSubline(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Call to action">
          <input value={cta} onChange={(e) => setCta(e.target.value)} className={inputCls} />
        </Field>

        <Field label="Background photo">
          <input type="file" accept="image/*" onChange={onPhoto} className="text-xs text-muted" />
          {photo && (
            <div className="mt-2">
              <label className="font-mono text-[10px] uppercase text-faint">Darken {darken}%</label>
              <input
                type="range"
                min={0}
                max={80}
                value={darken}
                onChange={(e) => setDarken(Number(e.target.value))}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="mt-1 font-mono text-[10px] uppercase text-accent-red hover:underline"
              >
                Remove photo
              </button>
            </div>
          )}
        </Field>

        <ColorRow label="Background" value={bg} onChange={setBg} />
        <ColorRow label="Text" value={fg} onChange={setFg} />
        <ColorRow label="Accent" value={accent} onChange={setAccent} />

        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-muted">
          <input
            type="checkbox"
            checked={showLogo}
            onChange={(e) => setShowLogo(e.target.checked)}
          />
          Show Frame Africa mark
        </label>

        <div className="border-t border-border pt-4">
          <Field label="Ad title (internal)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={headline}
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
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{label}</span>
      <div className="mt-1">{children}</div>
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
      <div className="mt-1 flex items-center gap-2">
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
            className="h-6 w-6 rounded-full ring-1 ring-border"
          />
        ))}
      </div>
    </div>
  );
}

/** Greedy word-wrap constrained to `maxLines`; the last line gets an ellipsis. */
function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    if (words.join(' ') !== lines.join(' ')) lines[maxLines - 1] = `${last}…`;
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
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
