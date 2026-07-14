'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

/**
 * Breaking-news alerts. The browser talks to the API through the server, the way
 * everything else here does — so a signed-in reader's subscription is tied to
 * their account without the browser ever handling the access token.
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface PushKeys {
  /** Null when the newsroom has not generated the web-push keys yet. */
  publicKey: string | null;
}

/** What a browser hands us when the reader says yes. */
export interface BrowserSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function post(path: string, body: unknown): Promise<boolean> {
  const token = await getAccessToken();
  try {
    const res = await fetch(`${API_URL}/push/${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** The key the browser needs to subscribe. Null → the site hides the toggle. */
export async function fetchPushKey(): Promise<PushKeys> {
  try {
    const res = await fetch(`${API_URL}/push/key`, { next: { revalidate: 300 } });
    if (!res.ok) return { publicKey: null };
    const json = (await res.json()) as { data: PushKeys };
    return json.data;
  } catch {
    return { publicKey: null };
  }
}

export async function subscribeToAlerts(subscription: BrowserSubscription): Promise<boolean> {
  return post('subscribe', subscription);
}

export async function unsubscribeFromAlerts(endpoint: string): Promise<boolean> {
  return post('unsubscribe', { endpoint });
}

/** Admin: how many browsers we can reach, and whether push is set up at all. */
export async function fetchPushOverview(): Promise<{ configured: boolean; subscribers: number }> {
  const token = await getAccessToken();
  if (!token) return { configured: false, subscribers: 0 };
  try {
    const res = await fetch(`${API_URL}/admin/push`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { configured: false, subscribers: 0 };
    const json = (await res.json()) as { data: { configured: boolean; subscribers: number } };
    return json.data;
  } catch {
    return { configured: false, subscribers: 0 };
  }
}

/**
 * Admin: mint the VAPID pair. Without `force` an existing pair is kept — a new
 * one would silently orphan every browser already subscribed under the old one.
 */
export async function generatePushKeys(force = false): Promise<{ ok: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: 'Sign in again.' };
  try {
    const res = await fetch(`${API_URL}/admin/push/keys?force=${force ? 'true' : 'false'}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, error: 'Could not generate the keys.' };
    revalidatePath('/dashboard/settings');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the API.' };
  }
}
