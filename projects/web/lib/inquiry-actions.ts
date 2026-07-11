'use server';

import { revalidatePath } from 'next/cache';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface InquiryFormState {
  error?: string;
  success?: boolean;
}

/** Public footer-form submission (advertise or contact). No auth. */
export async function submitInquiry(
  _prev: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  const type = String(formData.get('type') ?? 'contact');
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();

  if (name.length < 2) return { error: 'Please enter your name.' };
  if (!/.+@.+\..+/.test(email)) return { error: 'Please enter a valid email address.' };
  if (message.length < 5) return { error: 'Please add a short message.' };

  const payload = {
    type,
    name,
    email,
    message,
    company: String(formData.get('company') ?? '').trim() || undefined,
    subject: String(formData.get('subject') ?? '').trim() || undefined,
    budget: String(formData.get('budget') ?? '').trim() || undefined,
    placement: String(formData.get('placement') ?? '').trim() || undefined,
  };

  try {
    const res = await fetch(`${API_URL}/inquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (res.status === 429) return { error: 'Too many submissions — please try again shortly.' };
    if (!res.ok) return { error: 'Something went wrong. Please try again.' };
  } catch {
    return { error: 'Could not reach the server. Please try again.' };
  }
  return { success: true };
}

/** Admin: move an inquiry through its status pipeline. */
export async function setInquiryStatus(id: string, status: string): Promise<{ error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: 'Session expired.' };
  try {
    const res = await fetch(`${API_URL}/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
      cache: 'no-store',
    });
    if (!res.ok) return { error: 'Could not update the inquiry.' };
  } catch {
    return { error: 'Could not reach the server.' };
  }
  revalidatePath('/dashboard/inquiries');
  return {};
}
