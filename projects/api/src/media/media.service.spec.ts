import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../common/storage/storage.service';
import { MediaService } from './media.service';
import type { UploadedImage } from './media.types';

function build() {
  const prisma = {
    mediaAsset: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    mediaAlbum: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const storage = { save: jest.fn() };
  const service = new MediaService(
    prisma as unknown as PrismaService,
    storage as unknown as StorageService,
  );
  return { service, prisma, storage };
}

const file = (over: Partial<UploadedImage> = {}): UploadedImage => ({
  buffer: Buffer.from('x'),
  mimetype: 'image/jpeg',
  size: 1024,
  originalname: 'photo.jpg',
  ...over,
});

describe('MediaService', () => {
  describe('upload', () => {
    it('stores the file and catalogues it with metadata', async () => {
      const { service, prisma, storage } = build();
      storage.save.mockResolvedValue({ url: '/uploads/abc.jpg', filename: 'abc.jpg' });
      prisma.mediaAsset.create.mockImplementation((args: { data: Record<string, unknown> }) => ({
        id: 'm1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        ...args.data,
      }));

      const res = await service.upload('u1', file(), { alt: 'A cat', credit: 'Jane' });

      expect(storage.save).toHaveBeenCalledWith(expect.any(Buffer), '.jpg');
      expect(res.url).toBe('/uploads/abc.jpg');
      expect(res.alt).toBe('A cat');
      expect(res.credit).toBe('Jane');
    });

    it('rejects when no file is present', async () => {
      const { service } = build();
      await expect(service.upload('u1', undefined, {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an unsupported type', async () => {
      const { service } = build();
      await expect(
        service.upload('u1', file({ mimetype: 'application/pdf' }), {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a file over the size limit', async () => {
      const { service } = build();
      await expect(
        service.upload('u1', file({ size: 9 * 1024 * 1024 }), {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('list', () => {
    it('returns catalogued assets newest first', async () => {
      const { service, prisma } = build();
      prisma.mediaAsset.findMany.mockResolvedValue([
        {
          id: 'm1',
          url: '/uploads/a.jpg',
          alt: null,
          credit: null,
          licence: null,
          mime: 'image/jpeg',
          sizeBytes: 10,
          originalName: 'a.jpg',
          createdAt: new Date('2026-01-01T00:00:00Z'),
        },
      ]);

      const res = await service.list();
      expect(res.items).toHaveLength(1);
      expect(res.items[0].url).toBe('/uploads/a.jpg');
      expect(res.hasMore).toBe(false);
      const calls = prisma.mediaAsset.findMany.mock.calls as unknown[][];
      expect((calls[0]?.[0] as { orderBy: unknown }).orderBy).toEqual({ createdAt: 'desc' });
    });

    it('reports another page when the extra row comes back', async () => {
      const { service, prisma } = build();
      // Ask for 2 per page; the service fetches 3 to peek ahead.
      const row = (id: string) => ({
        id,
        url: `/uploads/${id}.jpg`,
        alt: null,
        credit: null,
        licence: null,
        mime: 'image/jpeg',
        sizeBytes: 10,
        originalName: null,
        albumId: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      });
      prisma.mediaAsset.findMany.mockResolvedValue([row('a'), row('b'), row('c')]);

      const res = await service.list(2, 1);

      expect(res.items).toHaveLength(2); // the peek row is trimmed off
      expect(res.hasMore).toBe(true);
      const args = prisma.mediaAsset.findMany.mock.calls[0]?.[0] as {
        skip: number;
        take: number;
      };
      expect(args.skip).toBe(0);
      expect(args.take).toBe(3);
    });

    it('narrows to one album, the unfiled pile, or a file kind', async () => {
      const { service, prisma } = build();

      await service.list(50, 1, 'album-1');
      await service.list(50, 1, 'unfiled');
      await service.list(50, 1, undefined, 'video');

      const calls = prisma.mediaAsset.findMany.mock.calls as unknown[][];
      const where = (i: number) => (calls[i]?.[0] as { where: Record<string, unknown> }).where;
      expect(where(0)).toEqual({ albumId: 'album-1' });
      expect(where(1)).toEqual({ albumId: null }); // "Unfiled"
      expect(where(2)).toEqual({ mime: { startsWith: 'video/' } });
    });
  });

  describe('albums', () => {
    it('creates an album with a slug derived from its name', async () => {
      const { service, prisma } = build();
      prisma.mediaAlbum.findUnique.mockResolvedValue(null); // slug is free
      prisma.mediaAlbum.create.mockImplementation((args: { data: Record<string, unknown> }) => ({
        id: 'al1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        description: null,
        eventDate: null,
        coverUrl: null,
        ...args.data,
      }));

      const album = await service.createAlbum('u1', { name: 'Kigali Summit' });

      expect(album.slug).toBe('kigali-summit');
      expect(album.assetCount).toBe(0);
    });

    it('rejects an album with no name', async () => {
      const { service } = build();
      await expect(service.createAlbum('u1', { name: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('files a photo into an album, and unfiles it with null', async () => {
      const { service, prisma } = build();
      prisma.mediaAsset.findUnique.mockResolvedValue({ id: 'm1' });
      prisma.mediaAlbum.findUnique.mockResolvedValue({ id: 'al1' });
      prisma.mediaAsset.update.mockImplementation((args: { data: Record<string, unknown> }) => ({
        id: 'm1',
        url: '/uploads/a.jpg',
        alt: null,
        credit: null,
        licence: null,
        mime: 'image/jpeg',
        sizeBytes: 1,
        originalName: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        ...args.data,
      }));

      const filed = await service.setAssetAlbum('m1', 'al1');
      expect(filed.albumId).toBe('al1');

      const unfiled = await service.setAssetAlbum('m1', null);
      expect(unfiled.albumId).toBeNull();
    });
  });
});
