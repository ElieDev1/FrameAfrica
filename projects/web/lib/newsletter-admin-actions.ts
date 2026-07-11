'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface SendState {
  error?: string;
  sent?: number;
}

/** Compose + send a newsletter to active subscribers (admin/editor). */
export async function sendCampaign(_prev: SendState, formData: FormData): Promise<SendState> {
  const token = await getAccessToken();
  if (!token) return { error: 'Your session expired — sign in again.' };

  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (subject.length < 3) return { error: 'Add a subject line.' };
  if (body.length < 10) return { error: 'Write a bit more in the body.' };

  try {
    const res = await fetch(`${API_URL}/newsletter/campaigns`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ subject, body }),
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not send the campaign.' };
    const json = (await res.json()) as { data: { recipients: number } };
    revalidatePath('/dashboard/newsletter');
    return { sent: json.data.recipients };
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
}
