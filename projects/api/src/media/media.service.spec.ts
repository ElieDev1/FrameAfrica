import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../common/storage/storage.service';
import { MediaService } from './media.service';
import type { UploadedImage } from './media.types';

function build() {
  const prisma = { mediaAsset: { create: jest.fn(), findMany: jest.fn() } };
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
      expect(res).toHaveLength(1);
      expect(res[0].url).toBe('/uploads/a.jpg');
      const calls = prisma.mediaAsset.findMany.mock.calls as unknown[][];
      expect((calls[0]?.[0] as { orderBy: unknown }).orderBy).toEqual({ createdAt: 'desc' });
    });
  });
});
