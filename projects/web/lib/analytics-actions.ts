'use server';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Best-effort page-view beacon (anonymous). Never throws. */
export async function recordPageView(
  path: string,
  articleId?: string,
  referrer?: string,
): Promise<void> {
  try {
    await fetch(`${API_URL}/analytics/view`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path, articleId, referrer }),
      cache: 'no-store',
    });
  } catch {
    // analytics is best-effort
  }
}
