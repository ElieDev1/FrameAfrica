import { redirect } from 'next/navigation';
import { getAccessToken } from './session';
import type { Integration, PublicSiteSettings } from './settings-types';

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type { Integration, PublicSiteSettings };

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

const EMPTY_SITE: PublicSiteSettings = { social: [], contactEmail: null, contactPhone: null };

/**
 * Public: the social links and contact details the footer renders. Cached for a
 * few minutes — admins change these rarely, and the footer is on every page. A
 * failure degrades to an empty footer rail rather than breaking the page.
 */
export async function fetchPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const res = await fetch(`${API_URL}/site/settings`, {
      headers: { accept: 'application/json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return EMPTY_SITE;
    const json = (await res.json()) as { data: PublicSiteSettings };
    return json.data ?? EMPTY_SITE;
  } catch {
    return EMPTY_SITE;
  }
}
