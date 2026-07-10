import type { AdminSettingsService } from '../admin/admin-settings.service';
import type { PrismaService } from '../prisma/prisma.service';
import { VideosService } from './videos.service';

function build() {
  const prisma = { video: { findMany: jest.fn(), upsert: jest.fn() } };
  const settings = { getValue: jest.fn() };
  const service = new VideosService(
    prisma as unknown as PrismaService,
    settings as unknown as AdminSettingsService,
  );
  return { service, prisma, settings };
}

describe('VideosService', () => {
  describe('sync', () => {
    it('is a no-op when the API key or channel is not configured', async () => {
      const { service, settings } = build();
      settings.getValue.mockResolvedValue(null);
      expect(await service.sync()).toEqual({ synced: 0, reason: 'not_configured' });
    });

    it('reports an error (never throws) when YouTube is unreachable', async () => {
      const { service, settings } = build();
      settings.getValue.mockResolvedValueOnce('key').mockResolvedValueOnce('UC123');
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      expect(await service.sync()).toEqual({ synced: 0, reason: 'error' });
    });
  });

  describe('list', () => {
    it('maps cached videos newest-first', async () => {
      const { service, prisma } = build();
      prisma.video.findMany.mockResolvedValue([
        {
          id: 'v1',
          youtubeId: 'abc',
          title: 'Kigali today',
          description: null,
          thumbnailUrl: null,
          publishedAt: new Date('2026-02-01T00:00:00Z'),
        },
      ]);
      const res = await service.list();
      expect(res[0]).toMatchObject({
        youtubeId: 'abc',
        title: 'Kigali today',
        publishedAt: '2026-02-01T00:00:00.000Z',
      });
      const arg = prisma.video.findMany.mock.calls[0][0] as { orderBy: unknown };
      expect(arg.orderBy).toEqual({ publishedAt: 'desc' });
    });
  });
});
