import { notFound, redirect } from 'next/navigation';
import { fetchCategories, fetchTopics, type Block, type TopicRef } from './api';
import { getAccessToken, getSession, type SessionUser } from './session';

/** Server-side helpers for the newsroom (CMS). All calls are authenticated. */

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

const STAFF_ROLES = [
  'journalist',
  'sub_editor',
  'photographer',
  'editor',
  'moderator',
  'ads_manager',
  'admin',
];
const EDITOR_ROLES = ['editor', 'admin'];
const COPYDESK_ROLES = ['sub_editor', 'editor', 'admin'];
const MODERATOR_ROLES = ['moderator', 'editor', 'admin'];
const GALLERY_ROLES = ['photographer', 'editor', 'admin'];

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
  // 2FA stays available (opt-in at /account/security; login honours it when
  // enabled). It can be made *mandatory* for staff — forcing enrolment before
  // the dashboard — by setting ENFORCE_STAFF_2FA=true (05 §3.3, FR-AUTH-6).
  // Off by default so the newsroom is reachable without enrolling.
  if (process.env.ENFORCE_STAFF_2FA === 'true' && !user.twoFactorEnabled) {
    redirect('/account/security');
  }
  return user;
}

/** Require a signed-in editor/admin, else redirect. Returns the user. */
export async function requireEditor(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!isEditor(user)) redirect('/dashboard');
  return user;
}

/** Require a sub-editor/editor/admin (copy desk access), else redirect. */
export async function requireCopyDesk(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!user.roles.some((role) => COPYDESK_ROLES.includes(role))) redirect('/dashboard');
  return user;
}

/** Require a moderator/editor/admin (comment moderation), else redirect. */
export async function requireModerator(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!user.roles.some((role) => MODERATOR_ROLES.includes(role))) redirect('/dashboard');
  return user;
}

/** Require a photographer/editor/admin (gallery desk), else redirect. */
export async function requirePhotographer(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/login');
  if (!user.roles.some((role) => GALLERY_ROLES.includes(role))) redirect('/dashboard');
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

/** Sub-editor copy desk queue (articles in `copy_edit`). */
export async function listCopyDesk(): Promise<ReviewItem[]> {
  const res = await fetch(`${API_URL}/cms/copydesk`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load the copy desk (${res.status})`);
  const json = (await res.json()) as { data: ReviewItem[] };
  return json.data;
}

/** Load a copy-desk article for editing. */
export async function getCopyDeskItem(id: string): Promise<DraftDetail> {
  const res = await fetch(`${API_URL}/cms/copydesk/${id}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load the article (${res.status})`);
  const json = (await res.json()) as { data: DraftDetail };
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
  // Optional so the page degrades gracefully if the API hasn't been redeployed
  // with the advanced-overview fields yet.
  publishTrend?: { date: string; count: number }[];
  articlesByStatus?: { status: string; count: number }[];
  topCategories?: { name: string; count: number }[];
  media?: { videos: number; galleries: number; episodes: number; interactives: number };
  engagement?: { views: number; likes: number; comments: number; shares: number };
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

export interface HouseAdAdmin {
  id: string;
  title: string;
  imageUrl: string | null;
  linkUrl: string;
  placement: 'leaderboard' | 'billboard' | 'rectangle' | 'halfpage' | 'native';
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

/** All house ads (admin). */
export async function fetchHouseAds(): Promise<HouseAdAdmin[]> {
  const res = await fetch(`${API_URL}/admin/ads`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load ads (${res.status})`);
  const json = (await res.json()) as { data: HouseAdAdmin[] };
  return json.data;
}

export interface AnalyticsOverview {
  readingNow: number;
  totalToday: number;
  topToday: { views: number; article: { id: string; slug: string; title: string } }[];
  topReferrers: { host: string; views: number }[];
  // Optional so the page degrades gracefully before the API ships these.
  totals?: { views: number; likes: number; comments: number; shares: number };
  byType?: { type: string; views: number; likes: number; comments: number; shares: number }[];
  viewsTrend?: { date: string; count: number }[];
  commentsTrend?: { date: string; count: number }[];
  commentStatus?: { status: string; count: number }[];
  topArticles?: { id: string; slug: string; title: string; views: number }[];
}

/** Real-time editor analytics overview (staff). */
export async function fetchAnalytics(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_URL}/analytics/overview`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load analytics (${res.status})`);
  const json = (await res.json()) as { data: AnalyticsOverview };
  return json.data;
}

export type TipStatus = 'new' | 'reviewing' | 'actioned' | 'dismissed';

export interface TipItem {
  id: string;
  message: string;
  contact: string | null;
  status: TipStatus;
  createdAt: string;
}

/** The confidential tips inbox (editor/moderator/admin). */
export async function fetchTips(): Promise<TipItem[]> {
  const res = await fetch(`${API_URL}/tips`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load tips (${res.status})`);
  const json = (await res.json()) as { data: TipItem[] };
  return json.data;
}

export type InquiryType = 'advertise' | 'contact';
export type InquiryStatus = 'new' | 'in_progress' | 'closed';

export interface InquiryItem {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  company: string | null;
  subject: string | null;
  message: string;
  budget: string | null;
  placement: string | null;
  status: InquiryStatus;
  createdAt: string;
}

/** Admin inbox of footer-form inquiries (advertising + contact). */
export async function fetchInquiries(): Promise<InquiryItem[]> {
  const res = await fetch(`${API_URL}/admin/inquiries`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load inquiries (${res.status})`);
  const json = (await res.json()) as { data: InquiryItem[] };
  return json.data;
}

/** Recent newsletter campaigns (editor/admin). */
export interface NewsletterCampaignItem {
  id: string;
  subject: string;
  recipients: number;
  sentAt: string | null;
  createdAt: string;
}

export async function fetchNewsletterData(): Promise<{
  count: number;
  campaigns: NewsletterCampaignItem[];
}> {
  const headers = await authHeaders();
  const [countRes, campRes] = await Promise.all([
    fetch(`${API_URL}/newsletter/subscribers/count`, { headers, cache: 'no-store' }),
    fetch(`${API_URL}/newsletter/campaigns`, { headers, cache: 'no-store' }),
  ]);
  if (countRes.status === 401 || campRes.status === 401) redirect('/login');
  const count = countRes.ok
    ? ((await countRes.json()) as { data: { count: number } }).data.count
    : 0;
  const campaigns = campRes.ok
    ? ((await campRes.json()) as { data: NewsletterCampaignItem[] }).data
    : [];
  return { count, campaigns };
}

export interface AdminVideoItem {
  id: string;
  youtubeId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string;
  isFeatured: boolean;
  isHidden: boolean;
}

/** Every cached clip (incl. hidden) for the Videos management dashboard. */
export async function fetchAdminVideos(): Promise<AdminVideoItem[]> {
  const res = await fetch(`${API_URL}/admin/videos`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load videos (${res.status})`);
  const json = (await res.json()) as { data: AdminVideoItem[] };
  return json.data;
}

export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
  credit?: string;
}

export interface GalleryListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  imageCount: number;
  status: 'draft' | 'published';
  publishedAt: string | null;
  updatedAt: string;
}

export interface GalleryDetail extends GalleryListItem {
  images: GalleryImage[];
  author: { id: string; displayName: string } | null;
}

/** Staff: every gallery (any status) for the management list. */
export async function fetchAdminGalleries(): Promise<GalleryListItem[]> {
  const res = await fetch(`${API_URL}/admin/galleries`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load galleries (${res.status})`);
  const json = (await res.json()) as { data: GalleryListItem[] };
  return json.data;
}

/** Staff: a single gallery for editing. */
export async function fetchAdminGallery(id: string): Promise<GalleryDetail> {
  const res = await fetch(`${API_URL}/admin/galleries/${id}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load gallery (${res.status})`);
  const json = (await res.json()) as { data: GalleryDetail };
  return json.data;
}

export interface PodcastEpisodeItem {
  id: string;
  showId: string;
  slug: string;
  title: string;
  description: string | null;
  mediaKind: 'audio' | 'video';
  mediaUrl: string;
  coverUrl: string | null;
  durationSec: number | null;
  episodeNo: number | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
}

export interface PodcastShowItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  spotifyUrl: string | null;
  appleUrl: string | null;
  rssUrl: string | null;
  status: 'draft' | 'published';
  episodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PodcastShowDetail extends PodcastShowItem {
  episodes: PodcastEpisodeItem[];
}

/** Staff: every podcast show (any status). */
export async function fetchAdminPodcasts(): Promise<PodcastShowItem[]> {
  const res = await fetch(`${API_URL}/admin/podcasts`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load podcasts (${res.status})`);
  const json = (await res.json()) as { data: PodcastShowItem[] };
  return json.data;
}

/** Staff: a show with its episodes for editing. */
export async function fetchAdminPodcast(id: string): Promise<PodcastShowDetail> {
  const res = await fetch(`${API_URL}/admin/podcasts/${id}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load podcast (${res.status})`);
  const json = (await res.json()) as { data: PodcastShowDetail };
  return json.data;
}

export type InteractiveProvider = 'datawrapper' | 'flourish' | 'infogram' | 'google' | 'youtube';

export interface InteractiveItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  provider: InteractiveProvider;
  embedUrl: string;
  coverUrl: string | null;
  aspectRatio: string;
  source: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Staff: every interactive (any status). */
export async function fetchAdminInteractives(): Promise<InteractiveItem[]> {
  const res = await fetch(`${API_URL}/admin/interactives`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load interactives (${res.status})`);
  const json = (await res.json()) as { data: InteractiveItem[] };
  return json.data;
}

/** Staff: a single interactive for editing. */
export async function fetchAdminInteractive(id: string): Promise<InteractiveItem> {
  const res = await fetch(`${API_URL}/admin/interactives/${id}`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`Failed to load interactive (${res.status})`);
  const json = (await res.json()) as { data: InteractiveItem };
  return json.data;
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; displayName: string } | null;
}

/** The privileged-action audit trail (admin only). */
export async function fetchAuditLog(): Promise<AuditEntry[]> {
  const res = await fetch(`${API_URL}/admin/audit`, {
    headers: await authHeaders(),
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new Error(`Failed to load the audit log (${res.status})`);
  const json = (await res.json()) as { data: AuditEntry[] };
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
