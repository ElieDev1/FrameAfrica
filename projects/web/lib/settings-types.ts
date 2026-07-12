export type IntegrationGroup =
  | 'social'
  | 'media'
  | 'email'
  | 'storage'
  | 'search'
  | 'payments'
  | 'ai'
  | 'analytics'
  | 'site'
  | 'custom';

export interface Integration {
  key: string;
  label: string;
  description: string;
  secret: boolean;
  group: IntegrationGroup;
  placeholder: string | null;
  isSet: boolean;
  source: 'database' | 'environment' | 'none';
  maskedValue: string | null;
  /** Present only for non-secret keys, so the form can pre-fill it for editing. */
  value: string | null;
  updatedAt: string | null;
}

/** The public slice the footer reads — only ever configured, non-secret links. */
export interface SocialLink {
  key: string;
  label: string;
  url: string;
}

export interface PublicSiteSettings {
  social: SocialLink[];
  contactEmail: string | null;
  contactPhone: string | null;
}
