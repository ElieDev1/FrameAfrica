import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { PrismaService } from '../prisma/prisma.service';

/** The model the newsroom assist runs on. Override per deployment with `ANTHROPIC_MODEL`. */
const DEFAULT_MODEL = 'claude-opus-4-8';

/**
 * Enough of an article to reason about, and no more. A long feature would
 * otherwise send tens of thousands of tokens for a two-line summary; the lede
 * and the first few sections carry the story.
 */
const MAX_INPUT_CHARS = 24_000;

/** Suggestions are short by construction — a summary, five headlines, six tags. */
const MAX_OUTPUT_TOKENS = 2_000;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  rw: 'Kinyarwanda',
  fr: 'French',
  sw: 'Swahili',
};

const NEWSROOM_SYSTEM = [
  'You are a subeditor at Frame Africa, a Rwandan digital newspaper covering Rwanda and the',
  'wider continent for an international readership.',
  '',
  'House style: factual, plain, and specific. Never sensationalise, never editorialise, and',
  'never invent a fact, a name, a number, or a quote that is not in the text you are given —',
  'if the text does not support a claim, leave it out. Prefer active verbs and concrete nouns.',
  'Kinyarwanda and French output must read as native newsroom copy, not as a literal',
  'word-for-word translation of English.',
  '',
  'Everything you produce is a suggestion for a human editor, who accepts or rejects it.',
].join('\n');

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

/**
 * AI assist for the newsroom (documents/04-API-Design.md §9): summaries,
 * headlines, tags and translation.
 *
 * Two things are deliberate:
 *
 * - **The key lives in Settings, not in the build.** It is resolved per call via
 *   `AdminSettingsService`, so an admin can add, rotate, or pull the key from the
 *   dashboard without a redeploy. With no key configured the endpoints refuse
 *   cleanly (503) rather than half-working.
 * - **Nothing here writes to an article.** Every method returns a suggestion the
 *   journalist may take or discard; the API never auto-publishes AI copy.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly settings: AdminSettingsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Whether AI assist is switched on — the editor hides its buttons when it is not. */
  async status(): Promise<{ configured: boolean; model: string }> {
    const key = await this.settings.getValue('ANTHROPIC_API_KEY');
    return { configured: Boolean(key), model: await this.model() };
  }

  /** A publishable standfirst plus the key points, in the article's own language. */
  async summarize(text: string, language = 'en'): Promise<SummarySuggestion> {
    return this.ask<SummarySuggestion>(
      [
        `Summarise this article for the ${this.languageName(language)} edition.`,
        '',
        '- `summary`: one standfirst paragraph of 25–45 words that tells a reader what happened',
        '  and why it matters. It must stand alone under the headline.',
        '- `bullets`: three to five key points, each a complete sentence under 20 words.',
        '',
        'Article:',
        this.clamp(text),
      ].join('\n'),
      {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'bullets'],
        additionalProperties: false,
      },
    );
  }

  /** Five headline options plus a standfirst, ranked strongest first. */
  async headlines(text: string, language = 'en'): Promise<HeadlineSuggestion> {
    return this.ask<HeadlineSuggestion>(
      [
        `Write headline options for this article, in ${this.languageName(language)}.`,
        '',
        '- `headlines`: exactly five options, strongest first. Each under 70 characters, in',
        '  sentence case, with an active verb. No clickbait, no colons stacking two clauses,',
        '  no question headlines unless the story genuinely poses one.',
        '- `standfirst`: one supporting line of under 140 characters that adds new information',
        '  rather than repeating the headline.',
        '',
        'Article:',
        this.clamp(text),
      ].join('\n'),
      {
        type: 'object',
        properties: {
          headlines: { type: 'array', items: { type: 'string' } },
          standfirst: { type: 'string' },
        },
        required: ['headlines', 'standfirst'],
        additionalProperties: false,
      },
    );
  }

  /**
   * Topic tags and a section. Both are grounded in the taxonomy that actually
   * exists on the site — a suggestion the newsroom cannot file under is useless,
   * so the model is given the real category and topic names to choose from.
   */
  async tags(text: string): Promise<TagSuggestion> {
    const [categories, topics] = await Promise.all([
      this.prisma.category.findMany({
        where: { isActive: true },
        select: { name: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.topic.findMany({
        where: { isActive: true },
        select: { name: true },
        take: 200,
      }),
    ]);
    const categoryNames = categories.map((c) => c.name);

    const suggestion = await this.ask<TagSuggestion>(
      [
        'Classify this article for the Frame Africa taxonomy.',
        '',
        `- \`category\`: exactly one of these section names, copied verbatim: ${categoryNames.join(', ')}.`,
        '- `tags`: four to six topic tags. Reuse an existing tag whenever one fits — matching an',
        '  existing tag is far more valuable than a new near-duplicate. Only coin a new tag for a',
        '  subject the list genuinely does not cover. Tags are proper nouns or subjects, not',
        '  sentences: "Kigali", "Monetary policy", "Women\'s football".',
        topics.length ? `\nExisting tags: ${topics.map((t) => t.name).join(', ')}` : '',
        '',
        'Article:',
        this.clamp(text),
      ].join('\n'),
      {
        type: 'object',
        properties: {
          category: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['category', 'tags'],
        additionalProperties: false,
      },
    );

    // The section has to exist for the editor to file under it. A near-miss
    // ("Business & Economy" vs "Business") is dropped rather than guessed at.
    const category =
      categoryNames.find((n) => n.toLowerCase() === suggestion.category?.toLowerCase()) ?? null;
    return { tags: suggestion.tags ?? [], category };
  }

  /** Translate a draft into one of the site's editions (rw / fr / en / sw). */
  async translate(
    text: string,
    target: string,
    title?: string | null,
  ): Promise<TranslationSuggestion> {
    const suggestion = await this.ask<TranslationSuggestion>(
      [
        `Translate this article into ${this.languageName(target)} for publication.`,
        '',
        'Keep the paragraph breaks, the facts, the names and the numbers exactly as they are.',
        'Do not summarise, do not add a note, and do not translate a proper noun that Rwandan',
        'readers would recognise in its original form.',
        '',
        `- \`title\`: the headline in ${this.languageName(target)}${title ? '' : ' (return an empty string — no headline was supplied)'}.`,
        '- `text`: the translated body, plain text, paragraphs separated by a blank line.',
        '',
        title ? `Headline: ${title}\n` : '',
        'Article:',
        this.clamp(text),
      ].join('\n'),
      {
        type: 'object',
        properties: {
          title: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['title', 'text'],
        additionalProperties: false,
      },
    );
    return { title: suggestion.title?.trim() ? suggestion.title : null, text: suggestion.text };
  }

  // ── plumbing ──────────────────────────────────────────────────────────────

  /**
   * One call to Claude, answered as JSON that matches `schema`. Structured
   * output means the editor never has to cope with a stray "Here are your
   * headlines:" preamble — the response either parses or it fails loudly.
   */
  private async ask<T>(prompt: string, schema: Record<string, unknown>): Promise<T> {
    const client = await this.client();
    const model = await this.model();

    let message: Anthropic.Message;
    try {
      message = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: NEWSROOM_SYSTEM,
        output_config: { format: { type: 'json_schema', schema } },
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (error) {
      this.logger.error('Anthropic request failed', error as Error);
      throw new ServiceUnavailableException('The AI assistant is unavailable right now.');
    }

    if (message.stop_reason === 'refusal') {
      throw new ServiceUnavailableException('The AI assistant declined to answer this request.');
    }

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    try {
      return JSON.parse(text) as T;
    } catch {
      this.logger.error(`Anthropic returned unparseable JSON: ${text.slice(0, 200)}`);
      throw new ServiceUnavailableException('The AI assistant returned an unusable answer.');
    }
  }

  /** Built per call: the key can change in Settings between one request and the next. */
  private async client(): Promise<Anthropic> {
    const apiKey = await this.settings.getValue('ANTHROPIC_API_KEY');
    if (!apiKey) {
      // Explicit, not silent: an editor pressing "Suggest" deserves to be told
      // the key is missing, and an admin can fix it in Settings in one step.
      throw new ServiceUnavailableException(
        'AI assist is not configured. Add an Anthropic API key in Settings → Integrations.',
      );
    }
    return new Anthropic({ apiKey });
  }

  private async model(): Promise<string> {
    return (await this.settings.getValue('ANTHROPIC_MODEL')) ?? DEFAULT_MODEL;
  }

  private languageName(code: string): string {
    return LANGUAGE_NAMES[code] ?? LANGUAGE_NAMES.en;
  }

  private clamp(text: string): string {
    const trimmed = text.trim();
    return trimmed.length > MAX_INPUT_CHARS ? `${trimmed.slice(0, MAX_INPUT_CHARS)}\n…` : trimmed;
  }
}
