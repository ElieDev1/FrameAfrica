import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { PodcastsService } from './podcasts.service';

function build() {
  const prisma = {
    podcastShow: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    podcastEpisode: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new PodcastsService(prisma as unknown as PrismaService);
  return { service, prisma };
}

function firstArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  return fn.mock.calls[0][0] as T;
}

describe('PodcastsService', () => {
  describe('createShow', () => {
    it('slugifies the title', async () => {
      const { service, prisma } = build();
      prisma.podcastShow.findUnique.mockResolvedValue(null);
      prisma.podcastShow.create.mockResolvedValue({
        id: 's1',
        slug: 'the-brief',
        title: 'The Brief',
        description: null,
        coverUrl: null,
        spotifyUrl: null,
        appleUrl: null,
        rssUrl: null,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        episodes: [],
        _count: { episodes: 0 },
      });
      const res = await service.createShow('u1', { title: 'The Brief' });
      expect(res.slug).toBe('the-brief');
      const arg = firstArg<{ data: { slug: string; createdById: string } }>(
        prisma.podcastShow.create,
      );
      expect(arg.data.slug).toBe('the-brief');
      expect(arg.data.createdById).toBe('u1');
    });
  });

  describe('createEpisode', () => {
    it('rejects a missing/invalid media URL', async () => {
      const { service, prisma } = build();
      prisma.podcastShow.findFirst.mockResolvedValue({ id: 's1' });
      await expect(
        service.createEpisode('s1', { title: 'Ep 1', mediaUrl: 'javascript:alert(1)' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404s when the show is missing', async () => {
      const { service, prisma } = build();
      prisma.podcastShow.findFirst.mockResolvedValue(null);
      await expect(
        service.createEpisode('s1', { title: 'Ep 1', mediaUrl: '/uploads/a.mp3' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates an audio episode with a sanitised URL', async () => {
      const { service, prisma } = build();
      prisma.podcastShow.findFirst.mockResolvedValue({ id: 's1' });
      prisma.podcastEpisode.findUnique.mockResolvedValue(null);
      prisma.podcastEpisode.create.mockResolvedValue({
        id: 'e1',
        showId: 's1',
        slug: 'ep-1',
        title: 'Ep 1',
        description: null,
        mediaKind: 'audio',
        mediaUrl: '/uploads/a.mp3',
        coverUrl: null,
        durationSec: null,
        episodeNo: null,
        status: 'draft',
        publishedAt: null,
        createdAt: new Date(),
      });
      const res = await service.createEpisode('s1', { title: 'Ep 1', mediaUrl: '/uploads/a.mp3' });
      expect(res.mediaUrl).toBe('/uploads/a.mp3');
      expect(res.mediaKind).toBe('audio');
    });
  });

  describe('updateEpisode', () => {
    it('stamps publishedAt on first publish', async () => {
      const { service, prisma } = build();
      prisma.podcastEpisode.findFirst.mockResolvedValue({ id: 'e1', publishedAt: null });
      prisma.podcastEpisode.update.mockResolvedValue({
        id: 'e1',
        showId: 's1',
        slug: 'ep-1',
        title: 'Ep 1',
        description: null,
        mediaKind: 'audio',
        mediaUrl: '/uploads/a.mp3',
        coverUrl: null,
        durationSec: null,
        episodeNo: null,
        status: 'published',
        publishedAt: new Date(),
        createdAt: new Date(),
      });
      await service.updateEpisode('e1', { status: 'published' });
      const arg = firstArg<{ data: { publishedAt?: Date } }>(prisma.podcastEpisode.update);
      expect(arg.data.publishedAt).toBeInstanceOf(Date);
    });
  });
});
