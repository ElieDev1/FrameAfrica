import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { GalleriesService, sanitizeImages } from './galleries.service';

function build() {
  const prisma = {
    gallery: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new GalleriesService(prisma as unknown as PrismaService);
  return { service, prisma };
}

/** First argument of a jest mock's first call, typed. */
function firstArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  return fn.mock.calls[0][0] as T;
}

describe('sanitizeImages', () => {
  it('keeps valid images, strips markup, and drops bad URLs', () => {
    const out = sanitizeImages([
      { url: '/uploads/a.jpg', alt: '<b>A</b>', caption: 'Cap', credit: 'Reuters' },
      { url: 'javascript:alert(1)', alt: 'x' },
      { url: 'https://cdn.example/b.png', alt: 'B' },
      'nonsense',
    ]);
    expect(out).toEqual([
      { url: '/uploads/a.jpg', alt: 'A', caption: 'Cap', credit: 'Reuters' },
      { url: 'https://cdn.example/b.png', alt: 'B' },
    ]);
  });

  it('returns [] for a non-array', () => {
    expect(sanitizeImages('x')).toEqual([]);
  });
});

describe('GalleriesService', () => {
  describe('create', () => {
    it('slugifies the title and sanitises images', async () => {
      const { service, prisma } = build();
      prisma.gallery.findUnique.mockResolvedValue(null);
      prisma.gallery.create.mockResolvedValue({
        id: 'g1',
        slug: 'kigali-nights',
        title: 'Kigali Nights',
        description: null,
        coverUrl: null,
        coverAlt: null,
        images: [{ url: '/uploads/a.jpg', alt: 'A' }],
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date('2026-02-01T00:00:00Z'),
        author: { id: 'u1', displayName: 'Jane' },
      });
      const res = await service.create('u1', {
        title: 'Kigali Nights',
        images: [{ url: '/uploads/a.jpg', alt: 'A' }],
      });
      expect(res.slug).toBe('kigali-nights');
      expect(res.imageCount).toBe(1);
      const arg = firstArg<{ data: { slug: string; authorId: string } }>(prisma.gallery.create);
      expect(arg.data.slug).toBe('kigali-nights');
      expect(arg.data.authorId).toBe('u1');
    });

    it('rejects an empty title', async () => {
      const { service } = build();
      await expect(service.create('u1', { title: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('stamps publishedAt when first published', async () => {
      const { service, prisma } = build();
      prisma.gallery.findFirst.mockResolvedValue({ id: 'g1', publishedAt: null });
      prisma.gallery.update.mockResolvedValue({
        id: 'g1',
        slug: 's',
        title: 'T',
        description: null,
        coverUrl: null,
        coverAlt: null,
        images: [],
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
        author: null,
      });
      await service.update('g1', { status: 'published' });
      const arg = firstArg<{ data: { publishedAt?: Date } }>(prisma.gallery.update);
      expect(arg.data.publishedAt).toBeInstanceOf(Date);
    });

    it('404s an unknown gallery', async () => {
      const { service, prisma } = build();
      prisma.gallery.findFirst.mockResolvedValue(null);
      await expect(service.update('g1', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
