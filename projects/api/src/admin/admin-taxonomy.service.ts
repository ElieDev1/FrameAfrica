import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';

export interface CategoryView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  articleCount: number;
  childCount: number;
}

export interface TopicView {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  articleCount: number;
}

/** Admin CRUD for the site taxonomy — sections/sub-sections and topics/tags. */
@Injectable()
export class AdminTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ───────────────────────────────────────────────────────────

  async listCategories(): Promise<CategoryView[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { articles: true, children: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentId: c.parentId,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      articleCount: c._count.articles,
      childCount: c._count.children,
    }));
  }

  async createCategory(input: {
    name: string;
    parentId?: string | null;
    description?: string;
    sortOrder?: number;
  }): Promise<CategoryView> {
    if (input.parentId) await this.assertCategory(input.parentId);
    const slug = await this.uniqueCategorySlug(slugify(input.name));
    const created = await this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        parentId: input.parentId || null,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return this.categoryById(created.id);
  }

  async updateCategory(
    id: string,
    input: {
      name?: string;
      slug?: string;
      parentId?: string | null;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ): Promise<CategoryView> {
    await this.assertCategory(id);
    if (input.parentId) {
      if (input.parentId === id)
        throw new BadRequestException('A section cannot be its own parent');
      await this.assertCategory(input.parentId);
    }
    const data: Prisma.CategoryUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = slugify(input.slug);
    if (input.description !== undefined) data.description = input.description || null;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.parentId !== undefined) {
      data.parent = input.parentId ? { connect: { id: input.parentId } } : { disconnect: true };
    }
    try {
      await this.prisma.category.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('That slug is already taken');
      }
      throw error;
    }
    return this.categoryById(id);
  }

  async deleteCategory(id: string): Promise<{ id: string; deleted: true }> {
    const c = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { articles: true, children: true } } },
    });
    if (!c) throw new NotFoundException('Section not found');
    if (c._count.children > 0) {
      throw new ConflictException('Move or delete the sub-sections first');
    }
    if (c._count.articles > 0) {
      throw new ConflictException('Reassign this section’s articles first');
    }
    await this.prisma.category.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ── Topics ─────────────────────────────────────────────────────────────────

  async listTopics(): Promise<TopicView[]> {
    const rows = await this.prisma.topic.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    });
    return rows.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      isActive: t.isActive,
      articleCount: t._count.articles,
    }));
  }

  async createTopic(input: { name: string; description?: string }): Promise<TopicView> {
    const slug = await this.uniqueTopicSlug(slugify(input.name));
    const created = await this.prisma.topic.create({
      data: { name: input.name, slug, description: input.description || null },
    });
    return this.topicById(created.id);
  }

  async updateTopic(
    id: string,
    input: { name?: string; slug?: string; description?: string | null; isActive?: boolean },
  ): Promise<TopicView> {
    await this.assertTopic(id);
    const data: Prisma.TopicUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = slugify(input.slug);
    if (input.description !== undefined) data.description = input.description || null;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    try {
      await this.prisma.topic.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('That slug is already taken');
      }
      throw error;
    }
    return this.topicById(id);
  }

  async deleteTopic(id: string): Promise<{ id: string; deleted: true }> {
    const t = await this.prisma.topic.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    });
    if (!t) throw new NotFoundException('Topic not found');
    if (t._count.articles > 0) {
      throw new ConflictException('Remove this topic from its articles first');
    }
    await this.prisma.topic.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private async categoryById(id: string): Promise<CategoryView> {
    return (await this.listCategories()).find((c) => c.id === id)!;
  }

  private async topicById(id: string): Promise<TopicView> {
    return (await this.listTopics()).find((t) => t.id === id)!;
  }

  private async assertCategory(id: string): Promise<void> {
    const c = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!c) throw new NotFoundException('Section not found');
  }

  private async assertTopic(id: string): Promise<void> {
    const t = await this.prisma.topic.findUnique({ where: { id }, select: { id: true } });
    if (!t) throw new NotFoundException('Topic not found');
  }

  private async uniqueCategorySlug(base: string): Promise<string> {
    for (let n = 1; n <= 50; n++) {
      const candidate = n === 1 ? base : `${base}-${n}`;
      const clash = await this.prisma.category.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
    return `${base}-${Date.now()}`;
  }

  private async uniqueTopicSlug(base: string): Promise<string> {
    for (let n = 1; n <= 50; n++) {
      const candidate = n === 1 ? base : `${base}-${n}`;
      const clash = await this.prisma.topic.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
    }
    return `${base}-${Date.now()}`;
  }
}
