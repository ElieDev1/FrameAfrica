'use client';

import { useId, useMemo, useState } from 'react';
import type { Block } from '@/lib/api';
import { MediaPicker } from './MediaPicker';

/**
 * The newsroom block editor — authors build a structured article document
 * (documents/13 §2) block by block: add, edit, reorder, and remove typed
 * blocks. The whole document is serialised into a hidden `blocks` input (JSON)
 * that the draft form submits; the API sanitises + validates it on write.
 */

type EditorBlock = Block & { _id: string };

const ADD_BUTTONS: { type: Block['type']; label: string }[] = [
  { type: 'paragraph', label: '¶ Paragraph' },
  { type: 'heading', label: 'H Subhead' },
  { type: 'image', label: '▣ Image' },
  { type: 'gallery', label: '▦ Gallery' },
  { type: 'pullquote', label: '❝ Pull-quote' },
  { type: 'blockquote', label: '❞ Quote' },
  { type: 'list', label: '• List' },
  { type: 'factbox', label: 'ℹ Fact-box' },
  { type: 'embed', label: '▶ Video' },
  { type: 'divider', label: '— Divider' },
];

let counter = 0;
const nextId = (): string => `b${Date.now().toString(36)}-${counter++}`;

function emptyBlock(type: Block['type']): EditorBlock {
  const _id = nextId();
  switch (type) {
    case 'paragraph':
      return { _id, type, text: '' };
    case 'heading':
      return { _id, type, level: 2, text: '' };
    case 'image':
      return { _id, type, url: '', alt: '' };
    case 'gallery':
      return {
        _id,
        type,
        images: [
          { url: '', alt: '' },
          { url: '', alt: '' },
        ],
      };
    case 'pullquote':
      return { _id, type, text: '' };
    case 'blockquote':
      return { _id, type, text: '' };
    case 'list':
      return { _id, type, style: 'bullet', items: [''] };
    case 'factbox':
      return { _id, type, title: '', body: '' };
    case 'embed':
      return { _id, type, provider: 'youtube', url: '', embedUrl: '' };
    case 'divider':
      return { _id, type };
  }
}

function toEditor(blocks: Block[] | null | undefined, fallbackBody: string): EditorBlock[] {
  if (blocks && blocks.length > 0) {
    return blocks.map((b) => ({ ...b, _id: nextId() }));
  }
  // Legacy: seed the editor from a plain body so old drafts stay editable.
  const paras = fallbackBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length === 0) return [emptyBlock('paragraph')];
  return paras.map((text, i) => ({
    _id: nextId(),
    type: 'paragraph',
    text,
    ...(i === 0 ? { lede: true } : {}),
  }));
}

/**
 * Prepare the document for submission: drop editor-only ids, clean list/gallery
 * children, and prune blocks the author left empty — so a stray empty paragraph
 * (e.g. a brand-new draft) never trips the server-side validator.
 */
function serialize(blocks: EditorBlock[]): string {
  const clean: Block[] = [];
  for (const editorBlock of blocks) {
    const b = stripId(editorBlock);
    if (b.type === 'list') {
      const items = b.items.map((i) => i.trim()).filter(Boolean);
      if (items.length > 0) clean.push({ ...b, items });
    } else if (b.type === 'gallery') {
      const images = b.images.filter((g) => g.url.trim());
      if (images.length > 0) clean.push({ ...b, images });
    } else if (!isEmptyBlock(b)) {
      clean.push(b);
    }
  }
  return JSON.stringify(clean);
}

/** Drop the editor-only `_id`, returning the plain block shape. */
function stripId(editorBlock: EditorBlock): Block {
  const clone: Record<string, unknown> = { ...editorBlock };
  delete clone._id;
  return clone as unknown as Block;
}

function isEmptyBlock(b: Block): boolean {
  switch (b.type) {
    case 'paragraph':
    case 'heading':
    case 'pullquote':
    case 'blockquote':
      return !b.text.trim();
    case 'image':
    case 'embed':
      return !b.url.trim();
    case 'factbox':
      return !b.title.trim() && !b.body.trim();
    default:
      return false;
  }
}

const input =
  'w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-body text-sm text-text outline-none focus:border-primary';
const ctrlBtn =
  'rounded border border-border px-2 py-1 font-mono text-[11px] text-muted hover:border-primary hover:text-primary disabled:opacity-30';

export function BlockEditor({
  name = 'blocks',
  initialBlocks,
  initialBody = '',
}: {
  name?: string;
  initialBlocks?: Block[] | null;
  initialBody?: string;
}) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => toEditor(initialBlocks, initialBody));
  const hiddenId = useId();

  const serialized = useMemo(() => serialize(blocks), [blocks]);

  // `next` is a loose partial: each field editor is already narrowed to its
  // block type, so the merged fields are valid for that block.
  const patch = (id: string, next: Record<string, unknown>) =>
    setBlocks((bs) => bs.map((b) => (b._id === id ? ({ ...b, ...next } as EditorBlock) : b)));
  const add = (type: Block['type']) => setBlocks((bs) => [...bs, emptyBlock(type)]);
  const remove = (id: string) => setBlocks((bs) => bs.filter((b) => b._id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b._id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={serialized} id={hiddenId} />

      {blocks.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center font-body text-sm text-muted">
          No blocks yet — add one below to start the story.
        </p>
      )}

      {blocks.map((block, i) => (
        <div key={block._id} className="rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
              {block.type}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={ctrlBtn}
                onClick={() => move(block._id, -1)}
                disabled={i === 0}
                aria-label="Move block up"
              >
                ↑
              </button>
              <button
                type="button"
                className={ctrlBtn}
                onClick={() => move(block._id, 1)}
                disabled={i === blocks.length - 1}
                aria-label="Move block down"
              >
                ↓
              </button>
              <button
                type="button"
                className={`${ctrlBtn} hover:border-accent-red hover:text-accent-red`}
                onClick={() => remove(block._id)}
                aria-label="Remove block"
              >
                ✕
              </button>
            </div>
          </div>
          <BlockFields block={block} onPatch={(next) => patch(block._id, next)} />
        </div>
      ))}

      <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border p-3">
        <span className="w-full font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          Add block
        </span>
        {ADD_BUTTONS.map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => add(type)}
            className="rounded-lg border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted hover:border-primary hover:text-primary"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onPatch,
}: {
  block: EditorBlock;
  onPatch: (next: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case 'paragraph':
      return (
        <div className="flex flex-col gap-2">
          <textarea
            className={`${input} leading-relaxed`}
            rows={3}
            value={block.text}
            placeholder="Write a paragraph…"
            onChange={(e) => onPatch({ text: e.target.value })}
          />
          <label className="flex items-center gap-2 font-body text-xs text-muted">
            <input
              type="checkbox"
              checked={block.lede ?? false}
              onChange={(e) => onPatch({ lede: e.target.checked })}
            />
            Lede (larger opening paragraph)
          </label>
        </div>
      );

    case 'heading':
      return (
        <div className="flex gap-2">
          <select
            className={`${input} max-w-[6rem]`}
            value={block.level}
            onChange={(e) => onPatch({ level: Number(e.target.value) === 3 ? 3 : 2 })}
          >
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input
            className={input}
            value={block.text}
            placeholder="Subheading text"
            onChange={(e) => onPatch({ text: e.target.value })}
          />
        </div>
      );

    case 'image':
      return (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={input}
              style={{ flex: 1, minWidth: '12rem' }}
              value={block.url}
              placeholder="Image URL (https://… or /seed/…)"
              onChange={(e) => onPatch({ url: e.target.value })}
            />
            <MediaPicker
              onSelect={(a) =>
                onPatch({
                  url: a.url,
                  alt: a.alt ?? '',
                  ...(a.credit ? { credit: a.credit } : {}),
                })
              }
            />
          </div>
          <input
            className={input}
            value={block.alt}
            placeholder="Alt text (describe the photo for accessibility)"
            onChange={(e) => onPatch({ alt: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            <input
              className={input}
              style={{ flex: 1 }}
              value={block.caption ?? ''}
              placeholder="Caption (optional)"
              onChange={(e) => onPatch({ caption: e.target.value })}
            />
            <input
              className={input}
              style={{ flex: 1 }}
              value={block.credit ?? ''}
              placeholder="Credit (optional)"
              onChange={(e) => onPatch({ credit: e.target.value })}
            />
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="flex flex-col gap-2">
          {block.images.map((img, idx) => (
            <div key={idx} className="flex flex-wrap gap-2">
              <input
                className={input}
                style={{ flex: 2 }}
                value={img.url}
                placeholder={`Image ${idx + 1} URL`}
                onChange={(e) =>
                  onPatch({
                    images: block.images.map((g, k) =>
                      k === idx ? { ...g, url: e.target.value } : g,
                    ),
                  })
                }
              />
              <input
                className={input}
                style={{ flex: 2 }}
                value={img.alt}
                placeholder="Alt text"
                onChange={(e) =>
                  onPatch({
                    images: block.images.map((g, k) =>
                      k === idx ? { ...g, alt: e.target.value } : g,
                    ),
                  })
                }
              />
              <button
                type="button"
                className={ctrlBtn}
                onClick={() => onPatch({ images: block.images.filter((_, k) => k !== idx) })}
                aria-label="Remove gallery image"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="self-start rounded border border-border px-2 py-1 font-mono text-[11px] text-muted hover:border-primary hover:text-primary"
              onClick={() => onPatch({ images: [...block.images, { url: '', alt: '' }] })}
            >
              + Add blank
            </button>
            <MediaPicker
              label="Add from library"
              onSelect={(a) =>
                onPatch({
                  images: [
                    ...block.images,
                    { url: a.url, alt: a.alt ?? '', ...(a.credit ? { credit: a.credit } : {}) },
                  ],
                })
              }
            />
          </div>
        </div>
      );

    case 'pullquote':
    case 'blockquote':
      return (
        <div className="flex flex-col gap-2">
          <textarea
            className={input}
            rows={2}
            value={block.text}
            placeholder="Quote text"
            onChange={(e) => onPatch({ text: e.target.value })}
          />
          <input
            className={input}
            value={block.attribution ?? ''}
            placeholder="Attribution (optional)"
            onChange={(e) => onPatch({ attribution: e.target.value })}
          />
        </div>
      );

    case 'list':
      return (
        <div className="flex flex-col gap-2">
          <select
            className={`${input} max-w-[10rem]`}
            value={block.style}
            onChange={(e) => onPatch({ style: e.target.value === 'number' ? 'number' : 'bullet' })}
          >
            <option value="bullet">Bulleted</option>
            <option value="number">Numbered</option>
          </select>
          <textarea
            className={input}
            rows={4}
            value={block.items.join('\n')}
            placeholder="One item per line"
            onChange={(e) => onPatch({ items: e.target.value.split('\n') })}
          />
        </div>
      );

    case 'factbox':
      return (
        <div className="flex flex-col gap-2">
          <input
            className={input}
            value={block.title}
            placeholder="Fact-box title (e.g. What to know)"
            onChange={(e) => onPatch({ title: e.target.value })}
          />
          <textarea
            className={input}
            rows={3}
            value={block.body}
            placeholder="Explainer / context"
            onChange={(e) => onPatch({ body: e.target.value })}
          />
        </div>
      );

    case 'embed':
      return (
        <input
          className={input}
          value={block.url}
          placeholder="YouTube URL (watch, youtu.be, or shorts)"
          onChange={(e) => onPatch({ url: e.target.value, embedUrl: '' })}
        />
      );

    case 'divider':
      return <p className="font-body text-xs text-faint">A horizontal section break.</p>;
  }
}
