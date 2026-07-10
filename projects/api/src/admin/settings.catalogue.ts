/**
 * The integrations Frame Africa knows how to use. Admins can set a value for
 * any of these from the dashboard; a key that isn't listed here can still be
 * stored as a custom setting. Each maps 1:1 to an env var name so a value in
 * the DB overrides (or supplies) the corresponding process.env fallback.
 */
export interface IntegrationDef {
  key: string;
  label: string;
  description: string;
  secret: boolean;
}

export const INTEGRATION_CATALOGUE: IntegrationDef[] = [
  {
    key: 'YOUTUBE_API_KEY',
    label: 'YouTube Data API',
    description: 'Enables video embeds and metadata lookups.',
    secret: true,
  },
  {
    key: 'YOUTUBE_CHANNEL_ID',
    label: 'YouTube channel ID',
    description: 'The channel whose uploads sync into the video hub (e.g. UCxxxxxxxxxxxx).',
    secret: false,
  },
  {
    key: 'ANTHROPIC_API_KEY',
    label: 'Anthropic (Claude)',
    description: 'AI assist for summaries, tagging, and the writing tools.',
    secret: true,
  },
  {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI',
    description: 'Alternate AI provider for assist features.',
    secret: true,
  },
  {
    key: 'MOMO_API_KEY',
    label: 'MTN MoMo',
    description: 'Mobile-money payments for subscriptions.',
    secret: true,
  },
  {
    key: 'AIRTEL_MONEY_API_KEY',
    label: 'Airtel Money',
    description: 'Mobile-money payments for subscriptions.',
    secret: true,
  },
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Stripe',
    description: 'Card payments for subscriptions.',
    secret: true,
  },
];

export function catalogueEntry(key: string): IntegrationDef | undefined {
  return INTEGRATION_CATALOGUE.find((i) => i.key === key);
}
