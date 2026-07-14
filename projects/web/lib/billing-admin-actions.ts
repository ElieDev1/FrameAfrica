'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';
import { fetchPlans } from './billing';
import type { AdminSubscription, Plan } from './billing-types';

/**
 * Admin: comp a subscription (corporate deal, cash payment, a giveaway) without
 * a card. The API's grant takes a user id, but an admin thinks in email
 * addresses — so this resolves the email to an account first, then grants.
 */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface GrantState {
  ok?: boolean;
  message?: string;
  error?: string;
}

/** The plans an admin can grant — same list the pricing page shows. */
export async function fetchGrantablePlans(): Promise<Plan[]> {
  return fetchPlans();
}

/** Find the account for an email so we can grant against its id. */
async function resolveUserId(token: string, email: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/admin/users?q=${encodeURIComponent(email)}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: { id: string; email: string }[] };
  // `q` is a contains-match, so pin to the exact address rather than the first hit.
  const match = json.data.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return match?.id ?? null;
}

export async function grantSubscription(
  _prev: GrantState,
  formData: FormData,
): Promise<GrantState> {
  const token = await getAccessToken();
  if (!token) return { error: 'Your session expired. Sign in again.' };

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const planCode = String(formData.get('planCode') ?? '').trim();

  if (!email || !planCode) return { error: 'Enter an email and choose a plan.' };

  const userId = await resolveUserId(token, email);
  if (!userId) return { error: `No account found for ${email}.` };

  try {
    const res = await fetch(`${API_URL}/admin/billing/grant`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ userId, planCode }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { message?: string } | null;
      return { error: body?.message ?? 'Could not grant the subscription.' };
    }
  } catch {
    return { error: 'Could not reach the API.' };
  }

  revalidatePath('/dashboard/billing');
  return { ok: true, message: `Granted ${planCode} to ${email}.` };
}

/** Every subscriber and where they stand. */
export async function fetchSubscribers(): Promise<AdminSubscription[]> {
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/admin/billing/subscriptions`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: AdminSubscription[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** End a subscription immediately (refund, chargeback, abuse). */
export async function revokeSubscription(id: string): Promise<{ ok: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { ok: false, error: 'Sign in again.' };
  try {
    const res = await fetch(`${API_URL}/admin/billing/subscriptions/${id}/revoke`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return { ok: false, error: 'Could not revoke the subscription.' };
    revalidatePath('/dashboard/billing');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the API.' };
  }
}
