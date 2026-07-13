'use server';

import { getAccessToken } from './session';
import type {
  AiStatus,
  HeadlineSuggestion,
  SummarySuggestion,
  TagSuggestion,
  TranslationSuggestion,
} from './ai-types';

/**
 * Server actions for the newsroom AI assist. The editor is a client component,
 * so every call hops through the server — which is where the staff access token
 * lives (HTTP-only cookie). The browser never sees the API token, and never
 * talks to Anthropic directly.
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** A suggestion, or the reason there isn't one — the panel shows the reason. */
export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function ask<T>(path: string, body: unknown): Promise<AiResult<T>> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: 'Your session expired. Sign in again.' };

  try {
    const res = await fetch(`${API_URL}/ai/${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      const message = Array.isArray(json.message) ? json.message[0] : json.message;
      return { ok: false, error: message ?? 'The AI assistant could not be reached.' };
    }

    const json = (await res.json()) as { data: T };
    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: 'The AI assistant could not be reached.' };
  }
}

/** Whether an Anthropic key is configured — the panel hides itself when it is not. */
export async function fetchAiStatus(): Promise<AiStatus> {
  const token = await getAccessToken();
  if (!token) return { configured: false, model: '' };
  try {
    const res = await fetch(`${API_URL}/ai/status`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { configured: false, model: '' };
    const json = (await res.json()) as { data: AiStatus };
    return json.data;
  } catch {
    return { configured: false, model: '' };
  }
}

export async function summarizeAction(
  text: string,
  language: string,
): Promise<AiResult<SummarySuggestion>> {
  return ask<SummarySuggestion>('summarize', { text, language });
}

export async function headlinesAction(
  text: string,
  language: string,
): Promise<AiResult<HeadlineSuggestion>> {
  return ask<HeadlineSuggestion>('headlines', { text, language });
}

export async function tagsAction(text: string): Promise<AiResult<TagSuggestion>> {
  return ask<TagSuggestion>('tags', { text });
}

export async function translateAction(
  text: string,
  target: string,
  title?: string,
): Promise<AiResult<TranslationSuggestion>> {
  return ask<TranslationSuggestion>('translate', { text, target, title: title || undefined });
}
