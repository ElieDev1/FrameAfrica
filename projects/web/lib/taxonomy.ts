import { redirect } from 'next/navigation';
import { getAccessToken } from './session';
import type { AdminCategory, AdminTopic } from './taxonomy-types';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type { AdminCategory, AdminTopic };

async function get<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  const res = await fetch(`${API_URL}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

export function fetchAdminCategories(): Promise<AdminCategory[]> {
  return get<AdminCategory[]>('/admin/taxonomy/categories');
}

export function fetchAdminTopics(): Promise<AdminTopic[]> {
  return get<AdminTopic[]>('/admin/taxonomy/topics');
}
