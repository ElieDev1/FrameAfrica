'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { PaymentProvider } from './billing-types';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface CheckoutState {
  error?: string;
  /** Mobile money: the prompt is on its way to the reader's handset. */
  pendingMessage?: string;
}

/** Surface the API's own message (e.g. "MoMo is not configured yet"). */
async function apiMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as {
      error?: { message?: string };
      message?: string | string[];
    };
    const msg = body.error?.message ?? body.message;
    const text = Array.isArray(msg) ? msg[0] : msg;
    return text || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Start a subscription. A card payment redirects to the gateway; mobile money
 * pushes a prompt to the reader's phone and stays pending until the gateway
 * calls us back. Access is never granted here — only a settled payment does that.
 */
export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const token = await getAccessToken();
  // A reader must have an account before they can have a subscription.
  if (!token) redirect('/login?next=/pricing');

  const planCode = String(formData.get('planCode') ?? '');
  const provider = String(formData.get('provider') ?? '') as PaymentProvider;
  const phone = String(formData.get('phone') ?? '').trim();

  if (!planCode || !provider) return { error: 'Pick a plan and a payment method.' };
  if ((provider === 'momo' || provider === 'airtel') && !phone) {
    return { error: 'Enter the mobile-money number to charge.' };
  }

  const res = await fetch(`${API_URL}/billing/me/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ planCode, provider, phone: phone || undefined }),
    cache: 'no-store',
  });

  if (res.status === 401) redirect('/login?next=/pricing');
  if (!res.ok) return { error: await apiMessage(res, 'Could not start the payment.') };

  const { data } = (await res.json()) as {
    data: { status: string; redirectUrl?: string; message?: string };
  };

  if (data.status === 'redirect' && data.redirectUrl) redirect(data.redirectUrl);

  revalidatePath('/account/billing');
  return {
    pendingMessage:
      data.message ?? 'Approve the payment prompt on your phone to finish subscribing.',
  };
}

/** Stop the renewal; access runs to the end of the paid period. */
export async function cancelSubscriptionAction(): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const res = await fetch(`${API_URL}/billing/me/cancel`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: await apiMessage(res, 'Could not cancel the subscription.') };

  revalidatePath('/account/billing');
  return {};
}
