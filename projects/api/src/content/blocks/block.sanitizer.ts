import { BadRequestException } from '@nestjs/common';
import { BLOCK_LIMITS, type Block, type BlockType, type GalleryImage } from './block.types';

/**
 * Validate and clean an untrusted blocks payload from an author (documents/05 §6).
 *
 * The contract: whatever comes back is a well-formed `Block[]` whose text fields
 * contain **no markup** — every string is stripped of HTML tags and control
 * characters, every URL is an allow-listed http(s) URL, and embeds resolve to a
 * safe provider URL. Anything malformed throws `BadRequestException` with a
 * message that names the offending block, so the editor can fix it.
 *
 * Defence in depth: the web renderer also output-encodes block text (React), so
 * even a hypothetical escape here cannot execute — but we keep stored data clean.
 */
export function sanitizeBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) {
    throw new BadRequestException('blocks must be an array');
  }
  if (input.length > BLOCK_LIMITS.maxBlocks) {
    throw new BadRequestException(`blocks: too many (max ${BLOCK_LIMITS.maxBlocks})`);
  }

  return input.map((raw, i) => sanitizeBlock(raw, i));
}

function sanitizeBlock(raw: unknown, i: number): Block {
  if (!isRecord(raw) || typeof raw.type !== 'string') {
    throw badBlock(i, 'unknown', 'each block needs a string "type"');
  }
  const type = raw.type as BlockType;

  switch (type) {
    case 'paragraph': {
      const text = requireText(raw.text, BLOCK_LIMITS.paragraphText, i, type, 'text');
      const block: Block = { type: 'paragraph', text };
      if (raw.lede === true) block.lede = true;
      return block;
    }
    case 'heading': {
      const text = requireText(raw.text, BLOCK_LIMITS.headingText, i, type, 'text');
      const level = raw.level === 3 ? 3 : 2;
      return { type: 'heading', level, text };
    }
    case 'image': {
      return sanitizeImage(raw, i);
    }
    case 'gallery': {
      if (!Array.isArray(raw.images)) {
        throw badBlock(i, type, 'gallery needs an "images" array');
      }
      if (
        raw.images.length < BLOCK_LIMITS.minGalleryImages ||
        raw.images.length > BLOCK_LIMITS.maxGalleryImages
      ) {
        throw badBlock(
          i,
          type,
          `gallery needs ${BLOCK_LIMITS.minGalleryImages}-${BLOCK_LIMITS.maxGalleryImages} images`,
        );
      }
      const images: GalleryImage[] = raw.images.map((img, j) => {
        const clean = sanitizeImage(img, i, j);
        // sanitizeImage returns an ImageBlock; narrow to the gallery image shape.
        return {
          url: clean.url,
          alt: clean.alt,
          ...(clean.caption ? { caption: clean.caption } : {}),
          ...(clean.credit ? { credit: clean.credit } : {}),
        };
      });
      return { type: 'gallery', images };
    }
    case 'pullquote':
    case 'blockquote': {
      const text = requireText(raw.text, BLOCK_LIMITS.paragraphText, i, type, 'text');
      const attribution = optionalText(raw.attribution, BLOCK_LIMITS.attribution, i, type);
      return attribution ? { type, text, attribution } : { type, text };
    }
    case 'list': {
      if (!Array.isArray(raw.items) || raw.items.length === 0) {
        throw badBlock(i, type, 'list needs a non-empty "items" array');
      }
      if (raw.items.length > BLOCK_LIMITS.maxListItems) {
        throw badBlock(i, type, `list: too many items (max ${BLOCK_LIMITS.maxListItems})`);
      }
      const items = raw.items.map((item) =>
        requireText(item, BLOCK_LIMITS.listItem, i, type, 'item'),
      );
      const style = raw.style === 'number' ? 'number' : 'bullet';
      return { type: 'list', style, items };
    }
    case 'factbox': {
      const title = requireText(raw.title, BLOCK_LIMITS.factboxTitle, i, type, 'title');
      const body = requireText(raw.body, BLOCK_LIMITS.factboxBody, i, type, 'body');
      return { type: 'factbox', title, body };
    }
    case 'embed': {
      const url = typeof raw.url === 'string' ? raw.url.trim() : '';
      const embedUrl = youtubeEmbedUrl(url);
      if (!embedUrl) {
        throw badBlock(i, type, 'only YouTube URLs are supported for embeds');
      }
      const caption = optionalText(raw.caption, BLOCK_LIMITS.caption, i, type);
      const block: Block = {
        type: 'embed',
        provider: 'youtube',
        url: safeHttpUrl(url)!,
        embedUrl,
      };
      if (caption) block.caption = caption;
      return block;
    }
    case 'divider':
      return { type: 'divider' };
    default:
      throw badBlock(i, String(type), 'unsupported block type');
  }
}

function sanitizeImage(raw: unknown, i: number, j?: number) {
  if (!isRecord(raw)) {
    throw badBlock(i, 'image', 'image block is malformed', j);
  }
  const url = safeHttpUrl(typeof raw.url === 'string' ? raw.url : '');
  if (!url) {
    throw badBlock(i, 'image', 'image needs a valid http(s) "url"', j);
  }
  // Alt text is required for accessibility (documents/06 §6, WCAG). An empty
  // string is allowed only as an explicit "decorative" signal.
  const alt = stripText(typeof raw.alt === 'string' ? raw.alt : '').slice(0, BLOCK_LIMITS.alt);
  const caption = optionalText(raw.caption, BLOCK_LIMITS.caption, i, 'image');
  const credit = optionalText(raw.credit, BLOCK_LIMITS.credit, i, 'image');
  return {
    type: 'image' as const,
    url,
    alt,
    ...(caption ? { caption } : {}),
    ...(credit ? { credit } : {}),
  };
}

// ---- helpers ---------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Remove HTML tags and control characters; collapse whitespace; trim. */
export function stripText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/\p{Cc}/gu, ' ') // strip control chars
    .replace(/\s+/g, ' ')
    .trim();
}

function requireText(value: unknown, max: number, i: number, type: string, field: string): string {
  if (typeof value !== 'string') {
    throw badBlock(i, type, `"${field}" must be a string`);
  }
  const clean = stripText(value);
  if (!clean) {
    throw badBlock(i, type, `"${field}" must not be empty`);
  }
  return clean.slice(0, max);
}

function optionalText(value: unknown, max: number, i: number, type: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw badBlock(i, type, 'optional text fields must be strings');
  }
  const clean = stripText(value).slice(0, max);
  return clean || undefined;
}

/** Accept only absolute http(s) URLs; reject javascript:, data:, etc. */
export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // not a valid absolute URL
  }
  return null;
}

/**
 * Resolve a YouTube watch/short/youtu.be/embed URL to a privacy-friendly
 * youtube-nocookie embed URL, or null if it isn't a recognisable YouTube URL.
 */
export function youtubeEmbedUrl(value: string): string | null {
  const id = youtubeId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

function youtubeId(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
  const valid = (id: string | null): string | null =>
    id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;

  if (host === 'youtu.be') {
    return valid(url.pathname.slice(1));
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') return valid(url.searchParams.get('v'));
    if (url.pathname.startsWith('/embed/')) return valid(url.pathname.split('/')[2] ?? null);
    if (url.pathname.startsWith('/shorts/')) return valid(url.pathname.split('/')[2] ?? null);
  }
  return null;
}

function badBlock(i: number, type: string, reason: string, j?: number): BadRequestException {
  const where = j === undefined ? `block ${i} (${type})` : `block ${i} (${type}) image ${j}`;
  return new BadRequestException(`${where}: ${reason}`);
}
