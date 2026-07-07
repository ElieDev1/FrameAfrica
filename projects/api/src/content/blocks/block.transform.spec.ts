import type { Block } from './block.types';
import {
  blocksFromPlainBody,
  plainTextFromBlocks,
  previewBlocks,
  readTimeFromBlocks,
} from './block.transform';

describe('blocksFromPlainBody', () => {
  it('splits paragraphs and marks the first as the lede', () => {
    const blocks = blocksFromPlainBody('First para.\n\nSecond para.');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ type: 'paragraph', text: 'First para.', lede: true });
    expect(blocks[1]).toEqual({ type: 'paragraph', text: 'Second para.' });
  });

  it('ignores empty gaps', () => {
    expect(blocksFromPlainBody('\n\n  \n\nOnly.')).toEqual([
      { type: 'paragraph', text: 'Only.', lede: true },
    ]);
  });
});

describe('plainTextFromBlocks', () => {
  it('extracts text from textual blocks and skips media', () => {
    const blocks: Block[] = [
      { type: 'heading', level: 2, text: 'Head' },
      { type: 'paragraph', text: 'Body' },
      { type: 'image', url: 'https://x/a.jpg', alt: 'a', caption: 'Cap' },
      { type: 'list', style: 'bullet', items: ['x', 'y'] },
      { type: 'divider' },
    ];
    expect(plainTextFromBlocks(blocks)).toBe('Head\n\nBody\n\nCap\n\nx y');
  });
});

describe('previewBlocks', () => {
  it('returns up to and including the first paragraph', () => {
    const blocks: Block[] = [
      { type: 'heading', level: 2, text: 'Head' },
      { type: 'paragraph', text: 'One' },
      { type: 'paragraph', text: 'Two' },
    ];
    expect(previewBlocks(blocks)).toHaveLength(2);
  });
});

describe('readTimeFromBlocks', () => {
  it('is at least one minute', () => {
    expect(readTimeFromBlocks([{ type: 'paragraph', text: 'short' }])).toBe(1);
  });

  it('scales with word count', () => {
    const text = Array.from({ length: 400 }, () => 'word').join(' ');
    expect(readTimeFromBlocks([{ type: 'paragraph', text }])).toBe(2);
  });
});
