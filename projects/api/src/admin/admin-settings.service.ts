import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  catalogueEntry,
  INTEGRATION_CATALOGUE,
  PUBLIC_SITE_KEYS,
  SOCIAL_KEYS,
  type IntegrationGroup,
} from './settings.catalogue';

/** Admin-facing view of an integration — never carries a raw secret. */
export interface IntegrationView {
  key: string;
  label: string;
  description: string;
  secret: boolean;
  group: IntegrationGroup | 'custom';
  placeholder: string | null;
  /** True when a value is configured (in the DB or via env). */
  isSet: boolean;
  /** Where the value comes from — helps admins understand precedence. */
  source: 'database' | 'environment' | 'none';
  /** Masked hint (last 4 chars) so admins can recognise the value. */
  maskedValue: string | null;
  /**
   * The value in the clear — only for non-secret keys (social URLs, hostnames),
   * so the dashboard can pre-fill the field for editing. Always null for secrets.
   */
  value: string | null;
  updatedAt: string | null;
}

/** What the public site is allowed to read: the footer's socials and contacts. */
export interface PublicSiteSettings {
  social: { key: string; label: string; url: string }[];
  contactEmail: string | null;
  contactPhone: string | null;
}

const KEY_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;

function mask(value: string): string {
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

/** Only http(s) links may reach the footer — no javascript:/data: URLs. */
function safeUrl(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** The catalogue plus any custom-stored keys, each with set-state + a mask. */
  async listIntegrations(): Promise<IntegrationView[]> {
    const rows = await this.prisma.appSetting.findMany();
    const byKey = new Map(rows.map((r) => [r.key, r]));

    const customKeys = rows.map((r) => r.key).filter((k) => !catalogueEntry(k));
    const keys = [...INTEGRATION_CATALOGUE.map((i) => i.key), ...customKeys];

    return keys.map((key) => {
      const def = catalogueEntry(key);
      const row = byKey.get(key);
      const envValue = this.config.get<string>(key);
      const secret = def?.secret ?? true;

      const base = {
        key,
        label: def?.label ?? key,
        description: def?.description ?? 'Custom integration key.',
        secret,
        group: def?.group ?? ('custom' as const),
        placeholder: def?.placeholder ?? null,
      };

      if (row) {
        return {
          ...base,
          isSet: true,
          source: 'database' as const,
          maskedValue: mask(row.value),
          value: secret ? null : row.value,
          updatedAt: row.updatedAt.toISOString(),
        };
      }
      return {
        ...base,
        isSet: !!envValue,
        source: envValue ? ('environment' as const) : ('none' as const),
        maskedValue: envValue ? mask(envValue) : null,
        value: !secret && envValue ? envValue : null,
        updatedAt: null,
      };
    });
  }

  /** Create or update a setting value. */
  async setIntegration(key: string, value: string): Promise<IntegrationView> {
    if (!KEY_PATTERN.test(key)) {
      throw new BadRequestException('Key must be UPPER_SNAKE_CASE (letters, digits, underscores).');
    }
    const def = catalogueEntry(key);
    const secret = def?.secret ?? true;

    // A social link ends up as an href in every reader's footer: reject anything
    // that isn't a plain http(s) URL rather than letting it through unchecked.
    const isSocial = (SOCIAL_KEYS as readonly string[]).includes(key);
    if (isSocial && !safeUrl(value)) {
      throw new BadRequestException('Enter a full link starting with https://');
    }

    await this.prisma.appSetting.upsert({
      where: { key },
      update: { value, isSecret: secret },
      create: { key, value, isSecret: secret },
    });
    const list = await this.listIntegrations();
    return list.find((i) => i.key === key)!;
  }

  /** Remove a stored setting (falls back to env, if any). */
  async removeIntegration(key: string): Promise<{ removed: boolean }> {
    await this.prisma.appSetting.deleteMany({ where: { key } });
    return { removed: true };
  }

  /**
   * Resolve a raw value for internal use: DB first, then env. Never exposed
   * through a controller — only injected into the services that consume it.
   */
  async getValue(key: string): Promise<string | null> {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? this.config.get<string>(key) ?? null;
  }

  /**
   * The subset of settings the public site may read — the footer's social links
   * and contact details. Secrets are structurally excluded: only keys listed in
   * SOCIAL_KEYS / PUBLIC_SITE_KEYS (all `secret: false`) are ever considered,
   * and an unset key is simply omitted so the footer hides that icon.
   */
  async publicSettings(): Promise<PublicSiteSettings> {
    const wanted = [...SOCIAL_KEYS, ...PUBLIC_SITE_KEYS];
    const rows = await this.prisma.appSetting.findMany({ where: { key: { in: [...wanted] } } });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    const resolve = (key: string): string | null =>
      byKey.get(key) ?? this.config.get<string>(key) ?? null;

    const social: PublicSiteSettings['social'] = [];
    for (const key of SOCIAL_KEYS) {
      const url = safeUrl(resolve(key));
      if (url) social.push({ key, label: catalogueEntry(key)?.label ?? key, url });
    }

    return {
      social,
      contactEmail: resolve('CONTACT_EMAIL'),
      contactPhone: resolve('CONTACT_PHONE'),
    };
  }
}
