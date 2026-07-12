import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminSettingsService } from './admin-settings.service';

function build(env: Record<string, string> = {}) {
  const prisma = {
    appSetting: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const config = { get: jest.fn((k: string) => env[k]) };
  const service = new AdminSettingsService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService,
  );
  return { service, prisma, config };
}

describe('AdminSettingsService', () => {
  it('lists catalogue keys, marking DB and env sources and masking values', async () => {
    const { service, prisma } = build({ ANTHROPIC_API_KEY: 'sk-ant-secret-9999' });
    prisma.appSetting.findMany.mockResolvedValue([
      { key: 'YOUTUBE_API_KEY', value: 'AIzaSyABCD1234', isSecret: true, updatedAt: new Date() },
    ]);

    const list = await service.listIntegrations();
    const yt = list.find((i) => i.key === 'YOUTUBE_API_KEY')!;
    const anthropic = list.find((i) => i.key === 'ANTHROPIC_API_KEY')!;
    const stripe = list.find((i) => i.key === 'STRIPE_SECRET_KEY')!;

    expect(yt.isSet).toBe(true);
    expect(yt.source).toBe('database');
    expect(yt.maskedValue).toBe('••••1234');
    expect(anthropic.source).toBe('environment');
    expect(anthropic.maskedValue).toBe('••••9999');
    expect(stripe.isSet).toBe(false);
    expect(stripe.maskedValue).toBeNull();
  });

  it('never returns the raw secret in the view', async () => {
    const { service, prisma } = build();
    prisma.appSetting.findMany.mockResolvedValue([
      { key: 'YOUTUBE_API_KEY', value: 'AIzaSyTOPSECRET', isSecret: true, updatedAt: new Date() },
    ]);
    const list = await service.listIntegrations();
    expect(JSON.stringify(list)).not.toContain('AIzaSyTOPSECRET');
  });

  it('upserts a valid key', async () => {
    const { service, prisma } = build();
    prisma.appSetting.findMany.mockResolvedValue([
      { key: 'YOUTUBE_API_KEY', value: 'newvalue1234', isSecret: true, updatedAt: new Date() },
    ]);
    await service.setIntegration('YOUTUBE_API_KEY', 'newvalue1234');
    expect(prisma.appSetting.upsert).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid key name', async () => {
    const { service } = build();
    await expect(service.setIntegration('bad-key', 'x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('getValue prefers DB, falls back to env', async () => {
    const { service, prisma } = build({ YOUTUBE_API_KEY: 'from-env' });
    prisma.appSetting.findUnique.mockResolvedValue({ value: 'from-db' });
    expect(await service.getValue('YOUTUBE_API_KEY')).toBe('from-db');

    prisma.appSetting.findUnique.mockResolvedValue(null);
    expect(await service.getValue('YOUTUBE_API_KEY')).toBe('from-env');
  });

  describe('social links', () => {
    it('returns a non-secret value in the clear so the form can pre-fill it', async () => {
      const { service, prisma } = build();
      prisma.appSetting.findMany.mockResolvedValue([
        {
          key: 'SOCIAL_X_URL',
          value: 'https://x.com/frameafrica',
          isSecret: false,
          updatedAt: new Date(),
        },
      ]);
      const x = (await service.listIntegrations()).find((i) => i.key === 'SOCIAL_X_URL')!;
      expect(x.group).toBe('social');
      expect(x.secret).toBe(false);
      expect(x.value).toBe('https://x.com/frameafrica');
    });

    it('rejects a social link that is not an http(s) URL', async () => {
      const { service } = build();
      await expect(
        service.setIntegration('SOCIAL_X_URL', 'javascript:alert(1)'),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.setIntegration('SOCIAL_X_URL', 'x.com/frame')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('publicSettings', () => {
    it('lists only the socials that are set, and never a secret', async () => {
      const { service, prisma } = build({ SOCIAL_YOUTUBE_URL: 'https://youtube.com/@frameafrica' });
      prisma.appSetting.findMany.mockResolvedValue([
        {
          key: 'SOCIAL_X_URL',
          value: 'https://x.com/frameafrica',
          isSecret: false,
          updatedAt: new Date(),
        },
        { key: 'CONTACT_EMAIL', value: 'hello@frameafrica.rw', isSecret: false, updatedAt: null },
      ]);

      const res = await service.publicSettings();

      expect(res.social.map((s) => s.key)).toEqual(['SOCIAL_X_URL', 'SOCIAL_YOUTUBE_URL']);
      expect(res.contactEmail).toBe('hello@frameafrica.rw');
      expect(res.contactPhone).toBeNull();
      // The query is scoped to the public allow-list, so no key can leak.
      const where = (
        prisma.appSetting.findMany.mock.calls[0] as [{ where: { key: { in: [] } } }]
      )[0].where;
      expect(where.key.in).not.toContain('STRIPE_SECRET_KEY');
    });

    it('drops a stored link that is not http(s)', async () => {
      const { service, prisma } = build();
      prisma.appSetting.findMany.mockResolvedValue([
        { key: 'SOCIAL_X_URL', value: 'javascript:alert(1)', isSecret: false, updatedAt: null },
      ]);
      expect((await service.publicSettings()).social).toEqual([]);
    });
  });
});
