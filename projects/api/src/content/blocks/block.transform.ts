import type { Block } from './block.types';

/**
 * Derive a plain-text rendering of a block document — used for the excerpt,
 * search indexing, read-time estimate, and the premium preview. Only textual
 * blocks contribute; media/divider blocks are skipped.
 */
export function plainTextFromBlocks(blocks: Block[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
      case 'pullquote':
      case 'blockquote':
        parts.push(block.text);
        break;
      case 'factbox':
        parts.push(`${block.title}. ${block.body}`);
        break;
      case 'list':
        parts.push(block.items.join(' '));
        break;
      case 'image':
        if (block.caption) parts.push(block.caption);
        break;
      default:
        break;
    }
  }
  return parts.join('\n\n');
}

/**
 * Convert a legacy plain-text body (paragraphs separated by blank lines) into
 * paragraph blocks, so articles written before the block model still render as
 * a structured document. The first paragraph is marked as the lede.
 */
export function blocksFromPlainBody(body: string): Block[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return paragraphs.map((text, i) =>
    i === 0 ? { type: 'paragraph', text, lede: true } : { type: 'paragraph', text },
  );
}

/**
 * The free teaser shown before the paywall: everything up to and including the
 * first paragraph (so a subhead/lede is visible), capped at one paragraph.
 */
export function previewBlocks(blocks: Block[]): Block[] {
  const firstParagraph = blocks.findIndex((b) => b.type === 'paragraph');
  if (firstParagraph === -1) {
    return blocks.slice(0, 1);
  }
  return blocks.slice(0, firstParagraph + 1);
}

/** Words-per-minute read-time estimate from a block document. */
export function readTimeFromBlocks(blocks: Block[]): number {
  const text = plainTextFromBlocks(blocks).trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}
