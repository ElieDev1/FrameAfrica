import type { PaymentRecord, Plan, Receipt, Subscription } from './billing-types';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

// Re-exported so server components can import types and fetchers from one place.
// Client components must import from `billing-types` instead — this module reads
// the session, which pulls in `next/headers`.
export * from './billing-types';

/** The plans on offer — public, so the pricing page works signed out. */
export async function fetchPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_URL}/billing/plans`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Plan[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** The signed-in reader's subscription, or null. */
export async function fetchMySubscription(): Promise<Subscription | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/billing/me/subscription`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Subscription | null };
    return json.data;
  } catch {
    return null;
  }
}

/** The reader's receipts. */
export async function fetchMyPayments(): Promise<PaymentRecord[]> {
  const token = await getAccessToken();
  if (!token) return [];
  try {
    const res = await fetch(`${API_URL}/billing/me/payments`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: PaymentRecord[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

/** The receipt for one settled payment, or null (not found / not the caller's). */
export async function fetchReceipt(paymentId: string): Promise<Receipt | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `${API_URL}/billing/me/payments/${encodeURIComponent(paymentId)}/receipt`,
      { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Receipt };
    return json.data;
  } catch {
    return null;
  }
}
