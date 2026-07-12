'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AdminUser } from './admin-types';
import { getAccessToken } from './session';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function adminFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return fetch(`${API_URL}/admin${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

export interface CreateUserResult {
  error?: string;
  user?: AdminUser;
  /** Shown once to the admin to hand over; never stored. */
  temporaryPassword?: string;
}

export async function createUser(input: {
  email: string;
  displayName: string;
  roles: string[];
}): Promise<CreateUserResult> {
  if (!input.email.trim() || !input.displayName.trim()) {
    return { error: 'Email and name are required.' };
  }
  if (input.roles.length === 0) return { error: 'Pick at least one role.' };

  const res = await adminFetch('/users', 'POST', input);
  if (res.status === 401) redirect('/login');
  if (res.status === 409) return { error: 'That email is already registered.' };
  if (!res.ok) return { error: 'Could not create the user.' };

  const json = (await res.json()) as { data: { user: AdminUser; temporaryPassword: string } };
  revalidatePath('/dashboard/users');
  return { user: json.data.user, temporaryPassword: json.data.temporaryPassword };
}

export async function setUserRoles(id: string, roles: string[]): Promise<{ error?: string }> {
  if (roles.length === 0) return { error: 'A user needs at least one role.' };
  const res = await adminFetch(`/users/${id}/roles`, 'PATCH', { roles });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not update roles.' };
  revalidatePath('/dashboard/users');
  return {};
}

export async function setUserStatus(id: string, status: string): Promise<{ error?: string }> {
  const res = await adminFetch(`/users/${id}/status`, 'PATCH', { status });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not update status.' };
  revalidatePath('/dashboard/users');
  return {};
}

export async function unlockUser(id: string): Promise<{ error?: string }> {
  const res = await adminFetch(`/users/${id}/unlock`, 'POST');
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not unlock the account.' };
  revalidatePath('/dashboard/users');
  return {};
}

export async function resetUserPassword(
  id: string,
): Promise<{ error?: string; email?: string; temporaryPassword?: string }> {
  const res = await adminFetch(`/users/${id}/reset-password`, 'POST');
  if (res.status === 401) redirect('/login');
  if (!res.ok) return { error: 'Could not reset the password.' };
  const json = (await res.json()) as { data: { email: string; temporaryPassword: string } };
  return { email: json.data.email, temporaryPassword: json.data.temporaryPassword };
}
