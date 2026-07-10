'use server';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Subscribe an email to the newsletter. Public + rate-limited on the API. */
export async function subscribeNewsletter(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    if (res.status === 429) return { ok: false, error: 'Too many attempts — try again shortly.' };
    if (res.status === 400) return { ok: false, error: 'Please enter a valid email address.' };
    if (!res.ok) return { ok: false, error: 'Could not subscribe. Please try again.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
}

/** Unsubscribe via a one-click token. */
export async function unsubscribeNewsletter(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/newsletter/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { data?: { unsubscribed?: boolean } };
    return Boolean(json.data?.unsubscribed);
  } catch {
    return false;
  }
}
