import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { AdminTaxonomyService } from './admin-taxonomy.service';

const catRow = (over: Record<string, unknown> = {}) => ({
  id: 'c1',
  name: 'Sport',
  slug: 'sport',
  description: null,
  parentId: null,
  sortOrder: 0,
  isActive: true,
  _count: { articles: 0, children: 0 },
  ...over,
});

function build() {
  const prisma = {
    category: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    topic: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const service = new AdminTaxonomyService(prisma as unknown as PrismaService);
  return { service, prisma };
}

function firstArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  return fn.mock.calls[0][0] as T;
}

describe('AdminTaxonomyService', () => {
  describe('createCategory', () => {
    it('slugifies the name and persists', async () => {
      const { service, prisma } = build();
      prisma.category.findUnique.mockResolvedValue(null); // slug free
      prisma.category.create.mockResolvedValue(catRow({ id: 'new' }));
      prisma.category.findMany.mockResolvedValue([catRow({ id: 'new', name: 'East Africa' })]);

      await service.createCategory({ name: 'East Africa' });

      const { data } = firstArg<{ data: { slug: string } }>(prisma.category.create);
      expect(data.slug).toBe('east-africa');
    });
  });

  describe('deleteCategory', () => {
    it('refuses when the section has sub-sections', async () => {
      const { service, prisma } = build();
      prisma.category.findUnique.mockResolvedValue(
        catRow({ _count: { articles: 0, children: 3 } }),
      );
      await expect(service.deleteCategory('c1')).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('refuses when the section still has articles', async () => {
      const { service, prisma } = build();
      prisma.category.findUnique.mockResolvedValue(
        catRow({ _count: { articles: 5, children: 0 } }),
      );
      await expect(service.deleteCategory('c1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('deletes an empty section', async () => {
      const { service, prisma } = build();
      prisma.category.findUnique.mockResolvedValue(catRow());
      prisma.category.delete.mockResolvedValue(catRow());
      const res = await service.deleteCategory('c1');
      expect(res.deleted).toBe(true);
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });
  });

  describe('deleteTopic', () => {
    it('refuses when the topic is still on articles', async () => {
      const { service, prisma } = build();
      prisma.topic.findUnique.mockResolvedValue({ id: 't1', _count: { articles: 2 } });
      await expect(service.deleteTopic('t1')).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
