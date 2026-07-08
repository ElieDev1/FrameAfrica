'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function authed(path: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

export interface TwoFactorSetupData {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

/** Begin enrolment: returns the QR + secret to add to an authenticator app. */
export async function setupTwoFactor(): Promise<{ data?: TwoFactorSetupData; error?: string }> {
  const res = await authed('/auth/2fa/setup');
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not start 2FA setup.' };
  const json = (await res.json()) as { data: TwoFactorSetupData };
  return { data: json.data };
}

/** Confirm a code to turn 2FA on. */
export async function enableTwoFactor(token: string): Promise<{ error?: string }> {
  const res = await authed('/auth/2fa/enable', { token: token.trim() });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'That code is not valid — try again.' };
  revalidatePath('/account/security');
  return {};
}

/** Turn 2FA off (requires a current code). */
export async function disableTwoFactor(token: string): Promise<{ error?: string }> {
  const res = await authed('/auth/2fa/disable', { token: token.trim() });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'That code is not valid — try again.' };
  revalidatePath('/account/security');
  return {};
}
