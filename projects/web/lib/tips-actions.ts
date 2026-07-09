'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

/** Staff: move a tip through its workflow (reviewing / actioned / dismissed). */
export async function updateTipStatus(
  id: string,
  status: 'new' | 'reviewing' | 'actioned' | 'dismissed',
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authorised');
  const res = await fetch(`${API_URL}/tips/${id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Could not update the tip.');
  revalidatePath('/dashboard/tips');
}

/** Submit a confidential news tip. Public + rate-limited on the API. */
export async function submitTip(
  message: string,
  contact?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/tips`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message, contact: contact || undefined }),
      cache: 'no-store',
    });
    if (res.status === 429) {
      return { ok: false, error: 'Too many submissions — please try again in a minute.' };
    }
    if (!res.ok) {
      return { ok: false, error: 'Could not send your tip. Please try again.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
}
