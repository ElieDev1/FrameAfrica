/**
 * The integrations Frame Africa knows how to use. Admins can set a value for
 * any of these from the dashboard; a key that isn't listed here can still be
 * stored as a custom setting. Each maps 1:1 to an env var name so a value in
 * the DB overrides (or supplies) the corresponding process.env fallback.
 */
export type IntegrationGroup =
  'social' | 'media' | 'email' | 'storage' | 'search' | 'payments' | 'ai' | 'analytics' | 'site';

export interface IntegrationDef {
  key: string;
  label: string;
  description: string;
  /** Secrets are write-only: the dashboard shows a mask, never the value. */
  secret: boolean;
  group: IntegrationGroup;
  /** Rendered as the field's placeholder — an example of the expected format. */
  placeholder?: string;
}

/**
 * The social profiles rendered in the site footer. Public by definition, so they
 * are never secret and are served unmasked from the public settings endpoint.
 */
export const SOCIAL_KEYS = [
  'SOCIAL_X_URL',
  'SOCIAL_FACEBOOK_URL',
  'SOCIAL_INSTAGRAM_URL',
  'SOCIAL_YOUTUBE_URL',
  'SOCIAL_LINKEDIN_URL',
  'SOCIAL_TIKTOK_URL',
  'SOCIAL_WHATSAPP_URL',
] as const;

/** Other non-secret details the footer and contact page may read. */
export const PUBLIC_SITE_KEYS = ['CONTACT_EMAIL', 'CONTACT_PHONE'] as const;

export const INTEGRATION_CATALOGUE: IntegrationDef[] = [
  // ── Social profiles (rendered in the footer) ──────────────────────────────
  {
    key: 'SOCIAL_X_URL',
    label: 'X (Twitter)',
    description: 'Your X profile. Appears in the footer once set.',
    secret: false,
    group: 'social',
    placeholder: 'https://x.com/frameafrica',
  },
  {
    key: 'SOCIAL_FACEBOOK_URL',
    label: 'Facebook',
    description: 'Your Facebook page. Appears in the footer once set.',
    secret: false,
    group: 'social',
    placeholder: 'https://facebook.com/frameafrica',
  },
  {
    key: 'SOCIAL_INSTAGRAM_URL',
    label: 'Instagram',
    description: 'Your Instagram profile. Appears in the footer once set.',
    secret: false,
    group: 'social',
    placeholder: 'https://instagram.com/frameafrica',
  },
  {
    key: 'SOCIAL_YOUTUBE_URL',
    label: 'YouTube',
    description: 'Your YouTube channel. Appears in the footer once set.',
    secret: false,
    group: 'social',
    placeholder: 'https://youtube.com/@frameafrica',
  },
  {
    key: 'SOCIAL_LINKEDIN_URL',
    label: 'LinkedIn',
    description: 'Your LinkedIn page. Appears in the footer once set.',
    secret: false,
    group: 'social',
    placeholder: 'https://linkedin.com/company/frameafrica',
  },
  {
    key: 'SOCIAL_TIKTOK_URL',
    label: 'TikTok',
    description: 'Your TikTok profile. Appears in the footer once set.',
    secret: false,
    group: 'social',
    placeholder: 'https://tiktok.com/@frameafrica',
  },
  {
    key: 'SOCIAL_WHATSAPP_URL',
    label: 'WhatsApp',
    description: 'A WhatsApp channel or click-to-chat link. Appears in the footer once set.',
    secret: false,
    group: 'social',
    placeholder: 'https://wa.me/250700000000',
  },

  // ── Media ─────────────────────────────────────────────────────────────────
  {
    key: 'YOUTUBE_API_KEY',
    label: 'YouTube Data API',
    description: 'Enables video embeds and metadata lookups.',
    secret: true,
    group: 'media',
  },
  {
    key: 'YOUTUBE_CHANNEL_ID',
    label: 'YouTube channel ID',
    description: 'The channel whose uploads feed the video hub.',
    secret: false,
    group: 'media',
    placeholder: 'UCxxxxxxxxxxxxxxxxxxxxxx',
  },

  // ── Transactional email ───────────────────────────────────────────────────
  {
    key: 'SMTP_HOST',
    label: 'SMTP host',
    description: 'Without a mail host, password resets are only logged — never delivered.',
    secret: false,
    group: 'email',
    placeholder: 'smtp.sendgrid.net',
  },
  {
    key: 'SMTP_PORT',
    label: 'SMTP port',
    description: 'Usually 587 (STARTTLS) or 465 (implicit TLS).',
    secret: false,
    group: 'email',
    placeholder: '587',
  },
  {
    key: 'SMTP_USER',
    label: 'SMTP username',
    description: 'Leave empty for an unauthenticated relay.',
    secret: false,
    group: 'email',
  },
  {
    key: 'SMTP_PASS',
    label: 'SMTP password',
    description: 'Required whenever a username is set.',
    secret: true,
    group: 'email',
  },
  {
    key: 'MAIL_FROM',
    label: 'From address',
    description: 'The sender readers see on transactional email.',
    secret: false,
    group: 'email',
    placeholder: 'Frame Africa <no-reply@frameafrica.rw>',
  },

  // ── Storage & CDN ─────────────────────────────────────────────────────────
  {
    key: 'S3_BUCKET',
    label: 'S3 bucket',
    description: 'Object storage for media uploads. Local disk is used until this is set.',
    secret: false,
    group: 'storage',
  },
  {
    key: 'S3_REGION',
    label: 'S3 region',
    description: 'e.g. eu-west-1 — or "auto" for Cloudflare R2.',
    secret: false,
    group: 'storage',
    placeholder: 'eu-west-1',
  },
  {
    key: 'S3_ENDPOINT',
    label: 'S3 endpoint',
    description: 'Only for S3-compatible providers (Cloudflare R2, MinIO).',
    secret: false,
    group: 'storage',
    placeholder: 'https://<account>.r2.cloudflarestorage.com',
  },
  {
    key: 'S3_ACCESS_KEY_ID',
    label: 'S3 access key ID',
    description: 'Credential for the media bucket.',
    secret: true,
    group: 'storage',
  },
  {
    key: 'S3_SECRET_ACCESS_KEY',
    label: 'S3 secret access key',
    description: 'Credential for the media bucket.',
    secret: true,
    group: 'storage',
  },
  {
    key: 'CDN_BASE_URL',
    label: 'CDN base URL',
    description: 'Serve media through a CDN rather than straight from the origin.',
    secret: false,
    group: 'storage',
    placeholder: 'https://cdn.frameafrica.rw',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  {
    key: 'OPENSEARCH_URL',
    label: 'OpenSearch URL',
    description: 'Full-text search cluster. Postgres search is used until this is set.',
    secret: false,
    group: 'search',
    placeholder: 'https://search.frameafrica.rw',
  },
  {
    key: 'OPENSEARCH_USERNAME',
    label: 'OpenSearch username',
    description: 'Basic-auth user for the search cluster.',
    secret: false,
    group: 'search',
  },
  {
    key: 'OPENSEARCH_PASSWORD',
    label: 'OpenSearch password',
    description: 'Basic-auth password for the search cluster.',
    secret: true,
    group: 'search',
  },

  // ── Payments ──────────────────────────────────────────────────────────────
  {
    key: 'MOMO_API_KEY',
    label: 'MTN MoMo',
    description: 'Mobile-money payments for subscriptions.',
    secret: true,
    group: 'payments',
  },
  {
    key: 'AIRTEL_MONEY_API_KEY',
    label: 'Airtel Money',
    description: 'Mobile-money payments for subscriptions.',
    secret: true,
    group: 'payments',
  },
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Stripe secret key',
    description: 'Card payments for subscriptions.',
    secret: true,
    group: 'payments',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    label: 'Stripe webhook secret',
    description: 'Verifies the payment events Stripe sends us.',
    secret: true,
    group: 'payments',
  },

  // ── AI ────────────────────────────────────────────────────────────────────
  {
    key: 'ANTHROPIC_API_KEY',
    label: 'Anthropic (Claude)',
    description: 'AI assist for summaries, tagging, and the writing tools.',
    secret: true,
    group: 'ai',
  },
  {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI',
    description: 'Alternate AI provider for the same assist features.',
    secret: true,
    group: 'ai',
  },

  // ── Analytics & anti-abuse ────────────────────────────────────────────────
  {
    key: 'GA_MEASUREMENT_ID',
    label: 'Google Analytics',
    description: 'Optional audience analytics, alongside the built-in counter.',
    secret: false,
    group: 'analytics',
    placeholder: 'G-XXXXXXXXXX',
  },
  {
    key: 'SENTRY_DSN',
    label: 'Sentry DSN',
    description: 'Error monitoring for the API and the site.',
    secret: true,
    group: 'analytics',
  },
  {
    key: 'RECAPTCHA_SITE_KEY',
    label: 'reCAPTCHA site key',
    description: 'Protects sign-up, tips, and inquiry forms from bots.',
    secret: false,
    group: 'analytics',
  },
  {
    key: 'RECAPTCHA_SECRET_KEY',
    label: 'reCAPTCHA secret key',
    description: 'Server-side verification for reCAPTCHA.',
    secret: true,
    group: 'analytics',
  },

  // ── Site ──────────────────────────────────────────────────────────────────
  {
    key: 'APP_URL',
    label: 'Public site URL',
    description: 'Used to build the links in emails and share cards.',
    secret: false,
    group: 'site',
    placeholder: 'https://frameafrica.rw',
  },
  {
    key: 'CONTACT_EMAIL',
    label: 'Contact email',
    description: 'Shown in the footer and on the contact page.',
    secret: false,
    group: 'site',
    placeholder: 'hello@frameafrica.rw',
  },
  {
    key: 'CONTACT_PHONE',
    label: 'Contact phone',
    description: 'Shown in the footer and on the contact page.',
    secret: false,
    group: 'site',
    placeholder: '+250 700 000 000',
  },
];

export function catalogueEntry(key: string): IntegrationDef | undefined {
  return INTEGRATION_CATALOGUE.find((i) => i.key === key);
}
