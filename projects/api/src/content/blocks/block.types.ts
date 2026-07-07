/**
 * Frame Africa — structured article content model (documents/13 §2).
 *
 * An article body is an ordered list of typed **blocks**, not a plain string.
 * This is what makes a story a real newspaper document (subheads, captioned
 * photos, galleries, pull-quotes, fact-boxes, embeds) instead of a text dump.
 *
 * These types are the single source of truth for the shape stored in
 * `Article.blocks` and served to the web app. Every block that reaches the
 * database has passed through `sanitizeBlocks` (block.sanitizer.ts), so the
 * renderer can treat block text as trusted-to-be-plain (still output-encoded).
 */

export const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'image',
  'gallery',
  'pullquote',
  'blockquote',
  'list',
  'factbox',
  'embed',
  'divider',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

/** Body text. `lede` marks the opening paragraph for a larger drop treatment. */
export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
  lede?: boolean;
}

/** A section sub-heading. `level` maps to <h2>/<h3>. */
export interface HeadingBlock {
  type: 'heading';
  level: 2 | 3;
  text: string;
}

/** A single inline photo with its required alt text and optional caption/credit. */
export interface ImageBlock {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
}

export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
}

/** A set of photos shown as a grid/carousel. */
export interface GalleryBlock {
  type: 'gallery';
  images: GalleryImage[];
}

/** A large highlighted quote pulled from the story. */
export interface PullquoteBlock {
  type: 'pullquote';
  text: string;
  attribution?: string;
}

/** A quotation from a source. */
export interface BlockquoteBlock {
  type: 'blockquote';
  text: string;
  attribution?: string;
}

/** A bulleted or numbered list. */
export interface ListBlock {
  type: 'list';
  style: 'bullet' | 'number';
  items: string[];
}

/** An explainer / definition / "what you need to know" box. */
export interface FactboxBlock {
  type: 'factbox';
  title: string;
  body: string;
}

/**
 * A safe third-party embed. Only allow-listed providers are accepted; the
 * sanitizer computes a privacy-friendly `embedUrl` (e.g. youtube-nocookie).
 */
export interface EmbedBlock {
  type: 'embed';
  provider: 'youtube';
  /** The original URL the author pasted (kept for reference/editing). */
  url: string;
  /** The safe URL the renderer loads in an iframe. */
  embedUrl: string;
  caption?: string;
}

/** A horizontal rule / section break. */
export interface DividerBlock {
  type: 'divider';
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | GalleryBlock
  | PullquoteBlock
  | BlockquoteBlock
  | ListBlock
  | FactboxBlock
  | EmbedBlock
  | DividerBlock;

/** Limits enforced by the sanitizer (defence against abuse / oversized payloads). */
export const BLOCK_LIMITS = {
  maxBlocks: 300,
  paragraphText: 6000,
  headingText: 200,
  caption: 400,
  credit: 200,
  alt: 400,
  attribution: 240,
  factboxTitle: 200,
  factboxBody: 4000,
  listItem: 600,
  maxListItems: 60,
  minGalleryImages: 2,
  maxGalleryImages: 30,
} as const;
