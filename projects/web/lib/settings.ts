import { redirect } from 'next/navigation';
import { getAccessToken } from './session';
import type { Integration } from './settings-types';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type { Integration };

/** Admin: list integration settings (masked). Empty on any error / no access. */
export async function fetchIntegrations(): Promise<Integration[]> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  const res = await fetch(`${API_URL}/admin/settings/integrations`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) return [];
  const json = (await res.json()) as { data: Integration[] };
  return json.data;
}
