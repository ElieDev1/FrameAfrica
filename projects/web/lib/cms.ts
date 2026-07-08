import { notFound, redirect } from 'next/navigation';
import { fetchCategories, fetchTopics, type Block, type TopicRef } from './api';
import { getAccessToken, getSession, type SessionUser } from './session';

/** Server-side helpers for the newsroom (CMS). All calls are authenticated. */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

const STAFF_ROLES = ['journalist', 'editor', 'admin'];
const EDITOR_ROLES = ['editor', 'admin'];

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
  /** The structured block document, or null for legacy plain-body drafts. */
  blocks: Block[] | null;
  topics: TopicRef[];
  /** Editor's note when the draft was returned (rejected); null otherwise. */
  reviewNote: string | null;
  /** Whether the (published) article is pinned to the homepage. */
  isFeatured: boolean;
  /** Whether the (published) article is in live/developing coverage. */
  isLive: boolean;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  featuredImageCredit: string | null;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  slug: string;
  title: string;
  status: DraftStatus;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  author: { id: string; displayName: string };
}

/** True if the user holds an editor/admin role. */
export function isEditor(user: SessionUser | null): boolean {
  return user?.roles.some((role) => EDITOR_ROLES.includes(role)) ?? false;
}

/** Require a signed-in staff user, else redirect. Returns the user. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/first-password');
  if (!user.roles.some((role) => STAFF_ROLES.includes(role))) redirect('/account');
  return user;
}

/** Require a signed-in editor/admin, else redirect. Returns the user. */
export async function requireEditor(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!isEditor(user)) redirect('/dashboard');
  return user;
}

/** Require a signed-in admin, else redirect. Returns the user. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!user.roles.includes('admin')) redirect('/dashboard');
  return user;
}

export async function listReviewQueue(): Promise<ReviewItem[]> {
  const res = await fetch(`${API_URL}/cms/review`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load the review queue (${res.status})`);
  const json = (await res.json()) as { data: ReviewItem[] };
  return json.data;
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

/** Admin: every article (any author/status), optionally filtered. */
export async function listAllArticles(
  filter: { status?: string; q?: string } = {},
): Promise<DraftListItem[]> {
  const search = new URLSearchParams();
  if (filter.status) search.set('status', filter.status);
  if (filter.q) search.set('q', filter.q);
  const query = search.toString();
  const res = await fetch(`${API_URL}/cms/admin/articles${query ? `?${query}` : ''}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load articles (${res.status})`);
  const json = (await res.json()) as { data: DraftListItem[] };
  return json.data;
}

/** Admin: load any article for editing. */
export async function getAnyArticle(id: string): Promise<DraftDetail> {
  const res = await fetch(`${API_URL}/cms/admin/articles/${id}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load article (${res.status})`);
  const json = (await res.json()) as { data: DraftDetail };
  return json.data;
}

export interface AdminOverview {
  users: { total: number; active: number; suspended: number; newLast7Days: number };
  articles: { total: number; published: number; inPipeline: number };
  comments: { visible: number; flagged: number };
  recentArticles: {
    id: string;
    slug: string;
    title: string;
    status: string;
    publishedAt: string | null;
    author: string;
  }[];
  recentComments: {
    id: string;
    body: string;
    createdAt: string;
    author: string;
    articleSlug: string;
  }[];
  recentUsers: {
    id: string;
    displayName: string;
    email: string;
    roles: string[];
    createdAt: string;
  }[];
}

/** Admin: system-wide activity snapshot for the monitoring dashboard. */
export async function fetchOverview(): Promise<AdminOverview> {
  const res = await fetch(`${API_URL}/admin/overview`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load overview (${res.status})`);
  const json = (await res.json()) as { data: AdminOverview };
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

export interface TopicOption {
  slug: string;
  name: string;
}

/** All active topics as `{ slug, name }` options for the draft tag picker. */
export async function topicOptions(): Promise<TopicOption[]> {
  const topics = await fetchTopics();
  return topics.map((t) => ({ slug: t.slug, name: t.name }));
}

export interface MediaAsset {
  id: string;
  url: string;
  alt: string | null;
  credit: string | null;
  licence: string | null;
  mime: string;
  sizeBytes: number;
  originalName: string | null;
  createdAt: string;
}

/** The staff media library (newest first). */
export async function listMedia(): Promise<MediaAsset[]> {
  const res = await fetch(`${API_URL}/cms/media`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load the media library (${res.status})`);
  const json = (await res.json()) as { data: MediaAsset[] };
  return json.data;
}

export function isEditable(status: DraftStatus): boolean {
  return status === 'draft' || status === 'in_progress' || status === 'rejected';
}
