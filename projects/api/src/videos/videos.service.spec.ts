import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { AdminSettingsService } from '../admin/admin-settings.service';
import type { PrismaService } from '../prisma/prisma.service';
import { parseYoutubeId, VideosService } from './videos.service';

function build() {
  const prisma = {
    video: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
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
    it('maps visible videos, featured first then newest', async () => {
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
      const arg = (
        prisma.video.findMany.mock.calls[0] as [{ where: unknown; orderBy: unknown }]
      )[0];
      expect(arg.where).toEqual({ isHidden: false });
      expect(arg.orderBy).toEqual([{ isFeatured: 'desc' }, { publishedAt: 'desc' }]);
    });
  });

  describe('listPage', () => {
    const row = (id: string) => ({
      id,
      youtubeId: 'abc',
      title: id,
      description: null,
      thumbnailUrl: null,
      publishedAt: new Date('2026-02-01T00:00:00Z'),
    });

    it('skips to the page and reports a next page when an extra row comes back', async () => {
      const { service, prisma } = build();
      // Asked for 2 → the service reads 3; the third row means "there's more".
      prisma.video.findMany.mockResolvedValue([row('v1'), row('v2'), row('v3')]);

      const res = await service.listPage(2, 2);

      expect(res.items.map((v) => v.id)).toEqual(['v1', 'v2']);
      expect(res.hasMore).toBe(true);
      const arg = (prisma.video.findMany.mock.calls[0] as [{ skip: number; take: number }])[0];
      expect(arg).toMatchObject({ skip: 2, take: 3 });
    });

    it('reports no next page on the last page', async () => {
      const { service, prisma } = build();
      prisma.video.findMany.mockResolvedValue([row('v1')]);

      const res = await service.listPage(2, 1);

      expect(res.items).toHaveLength(1);
      expect(res.hasMore).toBe(false);
    });
  });

  describe('getPublic', () => {
    it('404s on a hidden or missing clip', async () => {
      const { service, prisma } = build();
      prisma.video.findFirst = jest.fn().mockResolvedValue(null);
      await expect(service.getPublic('v9')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.video.findFirst).toHaveBeenCalledWith({
        where: { id: 'v9', isHidden: false },
      });
    });
  });

  describe('addByUrl', () => {
    it('rejects an unrecognisable URL', async () => {
      const { service } = build();
      await expect(service.addByUrl('https://example.com/x')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('requires a title when no API key is configured', async () => {
      const { service, settings } = build();
      settings.getValue.mockResolvedValue(null);
      await expect(service.addByUrl('https://youtu.be/dQw4w9WgXcQ')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('upserts a clip with a fallback thumbnail when a title is given', async () => {
      const { service, settings, prisma } = build();
      settings.getValue.mockResolvedValue(null);
      prisma.video.upsert.mockResolvedValue({
        id: 'v1',
        youtubeId: 'dQw4w9WgXcQ',
        title: 'Manual clip',
        description: null,
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        publishedAt: new Date('2026-02-01T00:00:00Z'),
        isFeatured: false,
        isHidden: false,
      });
      const res = await service.addByUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'Manual clip',
      );
      expect(res.youtubeId).toBe('dQw4w9WgXcQ');
      const arg = (prisma.video.upsert.mock.calls[0] as [{ create: { thumbnailUrl: string } }])[0];
      expect(arg.create.thumbnailUrl).toContain('dQw4w9WgXcQ');
    });
  });
});

describe('parseYoutubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts the id from %s', (input, expected) => {
    expect(parseYoutubeId(input)).toBe(expected);
  });

  it.each(['https://example.com/x', 'not a url', 'https://youtube.com/watch?v=short'])(
    'returns null for %s',
    (input) => {
      expect(parseYoutubeId(input)).toBeNull();
    },
  );
});
