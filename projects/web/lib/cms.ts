import { notFound, redirect } from 'next/navigation';
import { fetchCategories } from './api';
import { getAccessToken, getSession, type SessionUser } from './session';

/** Server-side helpers for the newsroom (CMS). All calls are authenticated. */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

const STAFF_ROLES = ['journalist', 'editor', 'admin'];

export type DraftStatus = 'draft' | 'in_progress' | 'rejected' | 'ready' | 'published' | string;

export interface DraftListItem {
  id: string;
  slug: string;
  title: string;
  status: DraftStatus;
  language: string;
  isPremium: boolean;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
}

export interface DraftDetail extends DraftListItem {
  subtitle: string | null;
  excerpt: string | null;
  body: string;
  createdAt: string;
}

/** Require a signed-in staff user, else redirect. Returns the user. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!user.roles.some((role) => STAFF_ROLES.includes(role))) redirect('/account');
  return user;
}

async function authHeaders(): Promise<{ authorization: string }> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  return { authorization: `Bearer ${token}` };
}

export async function listMyDrafts(): Promise<DraftListItem[]> {
  const res = await fetch(`${API_URL}/cms/articles`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load drafts (${res.status})`);
  const json = (await res.json()) as { data: DraftListItem[] };
  return json.data;
}

export async function getDraft(id: string): Promise<DraftDetail> {
  const res = await fetch(`${API_URL}/cms/articles/${id}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load draft (${res.status})`);
  const json = (await res.json()) as { data: DraftDetail };
  return json.data;
}

export interface CategoryOption {
  id: string;
  name: string;
}

/** Flatten the category tree into indented options for a <select>. */
export async function categoryOptions(): Promise<CategoryOption[]> {
  const tree = await fetchCategories();
  const out: CategoryOption[] = [];
  const walk = (nodes: typeof tree, depth: number): void => {
    for (const node of nodes) {
      out.push({ id: node.id, name: `${'— '.repeat(depth)}${node.name}` });
      walk(node.children, depth + 1);
    }
  };
  walk(tree, 0);
  return out;
}

export function isEditable(status: DraftStatus): boolean {
  return status === 'draft' || status === 'in_progress' || status === 'rejected';
}
