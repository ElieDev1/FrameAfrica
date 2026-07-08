import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { catalogueEntry, INTEGRATION_CATALOGUE } from './settings.catalogue';

/** Admin-facing view of an integration — never carries the raw secret. */
export interface IntegrationView {
  key: string;
  label: string;
  description: string;
  secret: boolean;
  /** True when a value is configured (in the DB or via env). */
  isSet: boolean;
  /** Where the value comes from — helps admins understand precedence. */
  source: 'database' | 'environment' | 'none';
  /** Masked hint (last 4 chars) so admins can recognise the value. */
  maskedValue: string | null;
  updatedAt: string | null;
}

const KEY_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;

function mask(value: string): string {
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
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

      if (row) {
        return {
          key,
          label: def?.label ?? key,
          description: def?.description ?? 'Custom integration key.',
          secret: def?.secret ?? true,
          isSet: true,
          source: 'database',
          maskedValue: mask(row.value),
          updatedAt: row.updatedAt.toISOString(),
        };
      }
      return {
        key,
        label: def?.label ?? key,
        description: def?.description ?? 'Custom integration key.',
        secret: def?.secret ?? true,
        isSet: !!envValue,
        source: envValue ? 'environment' : 'none',
        maskedValue: envValue ? mask(envValue) : null,
        updatedAt: null,
      };
    });
  }

  /** Create or update a setting value. */
  async setIntegration(key: string, value: string): Promise<IntegrationView> {
    if (!KEY_PATTERN.test(key)) {
      throw new BadRequestException('Key must be UPPER_SNAKE_CASE (letters, digits, underscores).');
    }
    const secret = catalogueEntry(key)?.secret ?? true;
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
}
