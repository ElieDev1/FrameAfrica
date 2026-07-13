import type { Block } from './api';

/** What the newsroom assist can hand back (mirrors the API's `/ai/*` routes). */
export interface SummarySuggestion {
  summary: string;
  bullets: string[];
}

export interface HeadlineSuggestion {
  headlines: string[];
  standfirst: string;
}

export interface TagSuggestion {
  tags: string[];
  category: string | null;
}

export interface TranslationSuggestion {
  title: string | null;
  text: string;
}

export interface AiStatus {
  configured: boolean;
  model: string;
}

/** The assist needs an article to read; below this there is nothing to reason about. */
export const MIN_ASSIST_CHARS = 200;

/**
 * Flatten the block document into the plain prose the assist reads. Images,
 * embeds and dividers carry no argument, so they are left out — sending them
 * would only cost tokens.
 */
export function blocksToText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
      case 'pullquote':
      case 'blockquote':
        if (block.text) parts.push(block.text);
        break;
      case 'list':
        parts.push(block.items.filter(Boolean).join('\n'));
        break;
      case 'factbox':
        parts.push([block.title, block.body].filter(Boolean).join('\n'));
        break;
      default:
        break;
    }
  }
  return parts.filter(Boolean).join('\n\n').trim();
}
