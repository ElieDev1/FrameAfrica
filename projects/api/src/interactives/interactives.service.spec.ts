import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { InteractivesService, resolveEmbed } from './interactives.service';

function build() {
  const prisma = {
    interactive: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const service = new InteractivesService(prisma as unknown as PrismaService);
  return { service, prisma };
}

function firstArg<T>(fn: { mock: { calls: unknown[][] } }): T {
  return fn.mock.calls[0][0] as T;
}

describe('resolveEmbed', () => {
  it.each([
    ['https://datawrapper.dwcdn.net/abcd/1/', 'datawrapper'],
    ['https://flo.uri.sh/visualisation/123/embed', 'flourish'],
    ['https://public.flourish.studio/visualisation/123/', 'flourish'],
    ['https://e.infogram.com/abc?src=embed', 'infogram'],
    ['https://lookerstudio.google.com/embed/reporting/xyz', 'google'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube'],
  ])('accepts %s as %s', (url, provider) => {
    expect(resolveEmbed(url)?.provider).toBe(provider);
  });

  it('normalises YouTube to a nocookie embed', () => {
    expect(resolveEmbed('https://youtu.be/dQw4w9WgXcQ')?.embedUrl).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
  });

  it.each([
    'https://evil.example/embed',
    'http://datawrapper.dwcdn.net/x/', // not https
    'not a url',
    'https://datawrapper.dwcdn.net.evil.com/x/',
  ])('rejects %s', (url) => {
    expect(resolveEmbed(url)).toBeNull();
  });
});

describe('InteractivesService', () => {
  it('rejects a non-allow-listed embed on create', async () => {
    const { service } = build();
    await expect(
      service.create('u1', { title: 'Chart', embedUrl: 'https://evil.example/x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates with the resolved provider + slug', async () => {
    const { service, prisma } = build();
    prisma.interactive.findUnique.mockResolvedValue(null);
    prisma.interactive.create.mockResolvedValue({
      id: 'i1',
      slug: 'budget-2027',
      title: 'Budget 2027',
      description: null,
      provider: 'datawrapper',
      embedUrl: 'https://datawrapper.dwcdn.net/abcd/1/',
      coverUrl: null,
      aspectRatio: '16/9',
      source: null,
      status: 'draft',
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const res = await service.create('u1', {
      title: 'Budget 2027',
      embedUrl: 'https://datawrapper.dwcdn.net/abcd/1/',
    });
    expect(res.provider).toBe('datawrapper');
    const arg = firstArg<{ data: { provider: string; slug: string } }>(prisma.interactive.create);
    expect(arg.data.provider).toBe('datawrapper');
    expect(arg.data.slug).toBe('budget-2027');
  });

  it('404s an unknown interactive on update', async () => {
    const { service, prisma } = build();
    prisma.interactive.findFirst.mockResolvedValue(null);
    await expect(service.update('i1', { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
  });
});
