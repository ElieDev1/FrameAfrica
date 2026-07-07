// Frame Africa — development seed data.
// Idempotent: re-running upserts the same rows. Run with `pnpm db:seed`.

import { ArticleLanguage, ArticleStatus, PrismaClient, RoleName } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Dev-only credentials for the seeded journalist (never used outside local dev).
const JOURNALIST_PASSWORD = 'DevPass123!';

const body = (lede: string): string =>
  [
    lede,
    'KIGALI — The developments were confirmed by officials on Tuesday, capping weeks of anticipation across the sector and drawing reaction from partners around the region.',
    'Analysts said the move signals continued momentum, though they cautioned that follow-through over the coming months will determine its lasting impact.',
    'More reporting to follow as the story develops.',
  ].join('\n\n');

async function main(): Promise<void> {
  const journalist = await prisma.role.upsert({
    where: { name: RoleName.journalist },
    update: {},
    create: { name: RoleName.journalist },
  });

  const passwordHash = await argon2.hash(JOURNALIST_PASSWORD, {
    type: argon2.argon2id,
  });
  const author = await prisma.user.upsert({
    where: { email: 'jane.uwase@frameafrica.rw' },
    update: { passwordHash },
    create: {
      email: 'jane.uwase@frameafrica.rw',
      displayName: 'Jane Uwase',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: author.id, roleId: journalist.id } },
    update: {},
    create: { userId: author.id, roleId: journalist.id },
  });

  // An editor, to exercise the review → publish/reject workflow.
  const editorRole = await prisma.role.upsert({
    where: { name: RoleName.editor },
    update: {},
    create: { name: RoleName.editor },
  });
  const editor = await prisma.user.upsert({
    where: { email: 'eric.mugisha@frameafrica.rw' },
    update: { passwordHash },
    create: {
      email: 'eric.mugisha@frameafrica.rw',
      displayName: 'Eric Mugisha',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: editor.id, roleId: editorRole.id } },
    update: {},
    create: { userId: editor.id, roleId: editorRole.id },
  });

  // Top-level sections, then one nested child (Business › Economy).
  const sections: { slug: string; name: string; sortOrder: number }[] = [
    { slug: 'rwanda', name: 'Rwanda', sortOrder: 1 },
    { slug: 'africa', name: 'Africa', sortOrder: 2 },
    { slug: 'business', name: 'Business', sortOrder: 3 },
    { slug: 'technology', name: 'Technology', sortOrder: 4 },
    { slug: 'sports', name: 'Sports', sortOrder: 5 },
  ];

  const bySlug: Record<string, { id: string }> = {};
  for (const section of sections) {
    bySlug[section.slug] = await prisma.category.upsert({
      where: { slug: section.slug },
      update: { name: section.name, sortOrder: section.sortOrder },
      create: section,
    });
  }

  bySlug['economy'] = await prisma.category.upsert({
    where: { slug: 'economy' },
    update: { name: 'Economy', parentId: bySlug['business'].id, sortOrder: 1 },
    create: {
      slug: 'economy',
      name: 'Economy',
      parentId: bySlug['business'].id,
      sortOrder: 1,
    },
  });

  const articles: {
    slug: string;
    title: string;
    subtitle: string;
    excerpt: string;
    category: string;
    isBreaking?: boolean;
    isPremium?: boolean;
    readTimeMin: number;
    daysAgo: number;
  }[] = [
    {
      slug: 'rwanda-coffee-exports-hit-record-high',
      title: 'Rwanda coffee exports hit record high on specialty demand',
      subtitle: 'Premium lots from the Western Province drove a double-digit rise in earnings.',
      excerpt:
        'Specialty buyers in Europe and Asia paid a growing premium for fully washed Rwandan lots this season.',
      category: 'business',
      isBreaking: true,
      readTimeMin: 4,
      daysAgo: 0,
    },
    {
      slug: 'kigali-innovation-city-adds-startups',
      title: 'Kigali Innovation City welcomes a new cohort of startups',
      subtitle: 'The campus continues to position the capital as a regional tech hub.',
      excerpt:
        'A dozen early-stage ventures move in this quarter, spanning fintech, health, and agritech.',
      category: 'technology',
      readTimeMin: 5,
      daysAgo: 1,
    },
    {
      slug: 'east-african-trade-corridor-upgrade',
      title: 'East African trade corridor upgrade nears completion',
      subtitle: 'Faster freight promises lower costs for landlocked economies.',
      excerpt:
        'Officials say the corridor will cut transit times between the coast and Kigali significantly.',
      category: 'africa',
      readTimeMin: 6,
      daysAgo: 2,
    },
    {
      slug: 'amavubi-name-squad-for-qualifier',
      title: 'Amavubi name squad for crucial qualifier',
      subtitle: 'The national side face a decisive fixture at Amahoro Stadium.',
      excerpt: 'The coach recalls two overseas-based players ahead of the weekend clash.',
      category: 'sports',
      readTimeMin: 3,
      daysAgo: 2,
    },
    {
      slug: 'central-bank-holds-key-rate',
      title: 'Central bank holds key rate as inflation cools',
      subtitle: 'Policymakers cite easing food prices and a stable franc.',
      excerpt: 'The monetary committee kept its benchmark unchanged for a second straight meeting.',
      category: 'economy',
      isPremium: true,
      readTimeMin: 5,
      daysAgo: 3,
    },
    {
      slug: 'kigali-green-transport-plan',
      title: 'Kigali unveils expanded green transport plan',
      subtitle: 'Electric buses and cycle lanes anchor the city’s next mobility phase.',
      excerpt: 'The plan targets cleaner air and shorter commutes across the capital.',
      category: 'rwanda',
      readTimeMin: 4,
      daysAgo: 4,
    },
  ];

  // Seeded view counts so "Most read" (sort=popular) has meaningful ordering.
  const views: Record<string, number> = {
    'rwanda-coffee-exports-hit-record-high': 4200,
    'kigali-innovation-city-adds-startups': 3100,
    'east-african-trade-corridor-upgrade': 1800,
    'amavubi-name-squad-for-qualifier': 5600,
    'central-bank-holds-key-rate': 900,
    'kigali-green-transport-plan': 2500,
  };

  const now = Date.now();
  for (const a of articles) {
    const publishedAt = new Date(now - a.daysAgo * 24 * 60 * 60 * 1000);
    const data = {
      slug: a.slug,
      title: a.title,
      subtitle: a.subtitle,
      excerpt: a.excerpt,
      body: body(a.excerpt),
      authorId: author.id,
      categoryId: bySlug[a.category].id,
      status: ArticleStatus.published,
      language: ArticleLanguage.en,
      isPremium: a.isPremium ?? false,
      isBreaking: a.isBreaking ?? false,
      readTimeMin: a.readTimeMin,
      viewCount: BigInt(views[a.slug] ?? 0),
      // Bundled cover art under /public/seed (see documents/06 §6 — alt + credit
      // are required). Real photography drops into the same field via the CMS
      // image URL or the S3 upload pipeline once available.
      featuredImageUrl: `/seed/${a.slug}.jpg`,
      featuredImageAlt: a.title,
      featuredImageCredit: 'Frame Africa',
      publishedAt,
      seo: {
        seoTitle: a.title,
        seoDescription: a.excerpt,
      },
    };

    await prisma.article.upsert({
      where: { slug: a.slug },
      update: data,
      create: data,
    });
  }

  // A reader plus a short comment thread so the article page isn't empty in dev.
  const readerRole = await prisma.role.upsert({
    where: { name: RoleName.reader },
    update: {},
    create: { name: RoleName.reader },
  });
  const reader = await prisma.user.upsert({
    where: { email: 'aline.dev@frameafrica.rw' },
    update: {},
    create: {
      email: 'aline.dev@frameafrica.rw',
      displayName: 'Aline U.',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: reader.id, roleId: readerRole.id } },
    update: {},
    create: { userId: reader.id, roleId: readerRole.id },
  });

  const coffee = await prisma.article.findUnique({
    where: { slug: 'rwanda-coffee-exports-hit-record-high' },
    select: { id: true },
  });
  if (coffee && (await prisma.comment.count({ where: { articleId: coffee.id } })) === 0) {
    const top = await prisma.comment.create({
      data: {
        articleId: coffee.id,
        authorId: reader.id,
        body: 'Great to see specialty demand rewarding smallholder growers.',
      },
    });
    await prisma.comment.create({
      data: {
        articleId: coffee.id,
        authorId: author.id,
        parentId: top.id,
        body: 'Agreed — the Western Province lots have been exceptional this season.',
      },
    });
  }

  const [categories, published] = await Promise.all([
    prisma.category.count(),
    prisma.article.count({ where: { status: ArticleStatus.published } }),
  ]);
  console.log(`Seed complete: ${categories} categories, ${published} published articles.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
