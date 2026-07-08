// Frame Africa — development seed data.
// Idempotent: re-running upserts the same rows. Run with `pnpm db:seed`.

import { ArticleLanguage, ArticleStatus, Prisma, PrismaClient, RoleName } from '@prisma/client';
import * as argon2 from 'argon2';
import type { Block } from '../src/content/blocks/block.types';
import { plainTextFromBlocks } from '../src/content/blocks/block.transform';

const prisma = new PrismaClient();

// Dev-only credentials for the seeded journalist (never used outside local dev).
const JOURNALIST_PASSWORD = 'DevPass123!';

/**
 * A bespoke, fully structured document for the flagship story, so the seed
 * shows off every block type (subheads, inline photo, pull-quote, list,
 * fact-box). Other articles get a solid generic block document below.
 */
const flagshipBlocks: Record<string, Block[]> = {
  'rwanda-coffee-exports-hit-record-high': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Rwanda’s coffee earnings reached a record this season as specialty buyers in Europe and Asia paid a growing premium for the country’s fully washed lots.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Export receipts rose by double digits year on year, officials confirmed on Tuesday, driven by premium micro-lots from the hills of the Western Province and steady demand from roasters chasing traceable, high-scoring coffee.',
    },
    { type: 'heading', level: 2, text: 'A record season' },
    {
      type: 'paragraph',
      text: 'Cooperatives reported stronger cherry prices at the washing station gate, a shift that growers said finally reflects the quality reputation Rwandan coffee has built at international cupping tables over the past decade.',
    },
    {
      type: 'image',
      url: '/seed/rwanda-coffee-exports-hit-record-high.jpg',
      alt: 'Coffee cherries drying on raised beds in the Western Province',
      caption: 'Fully washed cherries dry on raised beds before export grading.',
      credit: 'Frame Africa',
    },
    {
      type: 'pullquote',
      text: 'For the first time, the price at the gate matches the reputation in the cup.',
      attribution: 'Western Province cooperative manager',
    },
    { type: 'heading', level: 2, text: 'What it means for growers' },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Higher farm-gate prices for fully washed cherry',
        'Longer supply contracts with specialty roasters',
        'Renewed investment in washing-station capacity',
      ],
    },
    {
      type: 'factbox',
      title: 'Rwanda’s coffee at a glance',
      body: 'Coffee is one of Rwanda’s leading agricultural exports, grown largely by smallholders and processed at washing stations that grade cherries for the specialty market. Fully washed lots command the highest premiums.',
    },
    {
      type: 'paragraph',
      text: 'Analysts cautioned that weather and global price swings will test the gains, but said the season marks a durable step up the value chain. More reporting to follow as the story develops.',
    },
  ],
};

/** A solid generic block document derived from an article's own summary fields. */
function genericBlocks(a: { title: string; subtitle: string; excerpt: string }): Block[] {
  return [
    { type: 'paragraph', lede: true, text: a.excerpt },
    {
      type: 'paragraph',
      text: 'KIGALI — The developments were confirmed by officials on Tuesday, capping weeks of anticipation across the sector and drawing reaction from partners around the region.',
    },
    { type: 'heading', level: 2, text: 'Why it matters' },
    {
      type: 'paragraph',
      text: 'Analysts said the move signals continued momentum, though they cautioned that follow-through over the coming months will determine its lasting impact.',
    },
    { type: 'factbox', title: 'The context', body: a.subtitle },
    { type: 'paragraph', text: 'More reporting to follow as the story develops.' },
  ];
}

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

  // The full agreed nested taxonomy (documents/14 §5.1): top-level sections, each
  // with sub-sections. Section pages aggregate their sub-sections' articles; the
  // header shows the sections with sub-section dropdowns.
  const topSections: { slug: string; name: string; sortOrder: number }[] = [
    { slug: 'news', name: 'News', sortOrder: 1 },
    { slug: 'business', name: 'Business', sortOrder: 2 },
    { slug: 'technology', name: 'Technology', sortOrder: 3 },
    { slug: 'sports', name: 'Sport', sortOrder: 4 },
    { slug: 'opinion', name: 'Opinion', sortOrder: 5 },
    { slug: 'culture', name: 'Culture & Life', sortOrder: 6 },
    { slug: 'health', name: 'Health', sortOrder: 7 },
    { slug: 'environment', name: 'Environment & Climate', sortOrder: 8 },
    { slug: 'multimedia', name: 'Multimedia', sortOrder: 9 },
    { slug: 'notices', name: 'Notices', sortOrder: 10 },
    { slug: 'education', name: 'Education', sortOrder: 11 },
    { slug: 'agriculture', name: 'Agriculture', sortOrder: 12 },
    { slug: 'science', name: 'Science', sortOrder: 13 },
    { slug: 'investigations', name: 'Investigations', sortOrder: 14 },
    { slug: 'fact-check', name: 'Fact Check', sortOrder: 15 },
    { slug: 'live', name: 'Live', sortOrder: 16 },
  ];

  const subSections: { slug: string; name: string; parent: string; sortOrder: number }[] = [
    // News
    { slug: 'rwanda', name: 'Rwanda', parent: 'news', sortOrder: 1 },
    { slug: 'kigali', name: 'Kigali', parent: 'news', sortOrder: 2 },
    { slug: 'east-africa', name: 'East Africa', parent: 'news', sortOrder: 3 },
    { slug: 'africa', name: 'Africa', parent: 'news', sortOrder: 4 },
    { slug: 'world', name: 'World', parent: 'news', sortOrder: 5 },
    { slug: 'politics', name: 'Politics', parent: 'news', sortOrder: 6 },
    { slug: 'diplomacy', name: 'Diplomacy', parent: 'news', sortOrder: 7 },
    { slug: 'crime-justice', name: 'Crime & Justice', parent: 'news', sortOrder: 8 },
    // Business
    { slug: 'economy', name: 'Economy', parent: 'business', sortOrder: 1 },
    { slug: 'markets', name: 'Markets', parent: 'business', sortOrder: 2 },
    { slug: 'companies', name: 'Companies', parent: 'business', sortOrder: 3 },
    { slug: 'banking-finance', name: 'Banking & Finance', parent: 'business', sortOrder: 4 },
    { slug: 'agribusiness', name: 'Agribusiness', parent: 'business', sortOrder: 5 },
    { slug: 'startups', name: 'Startups & Tech', parent: 'business', sortOrder: 6 },
    { slug: 'real-estate', name: 'Real Estate', parent: 'business', sortOrder: 7 },
    { slug: 'personal-finance', name: 'Personal Finance', parent: 'business', sortOrder: 8 },
    // Technology
    { slug: 'mobile', name: 'Mobile', parent: 'technology', sortOrder: 1 },
    { slug: 'internet', name: 'Internet', parent: 'technology', sortOrder: 2 },
    { slug: 'ai', name: 'AI', parent: 'technology', sortOrder: 3 },
    { slug: 'fintech', name: 'Fintech', parent: 'technology', sortOrder: 4 },
    { slug: 'gadgets', name: 'Gadgets', parent: 'technology', sortOrder: 5 },
    // Sport
    { slug: 'football', name: 'Football', parent: 'sports', sortOrder: 1 },
    { slug: 'athletics', name: 'Athletics', parent: 'sports', sortOrder: 2 },
    { slug: 'basketball', name: 'Basketball', parent: 'sports', sortOrder: 3 },
    { slug: 'cycling', name: 'Cycling', parent: 'sports', sortOrder: 4 },
    { slug: 'volleyball', name: 'Volleyball', parent: 'sports', sortOrder: 5 },
    { slug: 'motorsport', name: 'Motorsport', parent: 'sports', sortOrder: 6 },
    // Opinion
    { slug: 'editorials', name: 'Editorials', parent: 'opinion', sortOrder: 1 },
    { slug: 'op-eds', name: 'Op-Eds', parent: 'opinion', sortOrder: 2 },
    { slug: 'columns', name: 'Columns', parent: 'opinion', sortOrder: 3 },
    { slug: 'letters', name: 'Letters', parent: 'opinion', sortOrder: 4 },
    { slug: 'cartoons', name: 'Cartoons', parent: 'opinion', sortOrder: 5 },
    // Culture & Life
    { slug: 'arts', name: 'Arts', parent: 'culture', sortOrder: 1 },
    { slug: 'music', name: 'Music', parent: 'culture', sortOrder: 2 },
    { slug: 'film-tv', name: 'Film & TV', parent: 'culture', sortOrder: 3 },
    { slug: 'books', name: 'Books', parent: 'culture', sortOrder: 4 },
    { slug: 'food-drink', name: 'Food & Drink', parent: 'culture', sortOrder: 5 },
    { slug: 'fashion', name: 'Fashion', parent: 'culture', sortOrder: 6 },
    { slug: 'travel', name: 'Travel & Tourism', parent: 'culture', sortOrder: 7 },
    { slug: 'lifestyle', name: 'Lifestyle', parent: 'culture', sortOrder: 8 },
    { slug: 'religion', name: 'Religion', parent: 'culture', sortOrder: 9 },
    // Health
    { slug: 'public-health', name: 'Public Health', parent: 'health', sortOrder: 1 },
    { slug: 'wellness', name: 'Wellness', parent: 'health', sortOrder: 2 },
    { slug: 'medicine', name: 'Medicine', parent: 'health', sortOrder: 3 },
    // Environment & Climate
    { slug: 'climate', name: 'Climate', parent: 'environment', sortOrder: 1 },
    { slug: 'conservation', name: 'Conservation', parent: 'environment', sortOrder: 2 },
    { slug: 'energy', name: 'Energy', parent: 'environment', sortOrder: 3 },
    // Education
    { slug: 'schools', name: 'Schools', parent: 'education', sortOrder: 1 },
    { slug: 'higher-education', name: 'Higher Education', parent: 'education', sortOrder: 2 },
    { slug: 'skills', name: 'Skills', parent: 'education', sortOrder: 3 },
    // Agriculture
    { slug: 'crops', name: 'Crops', parent: 'agriculture', sortOrder: 1 },
    { slug: 'livestock', name: 'Livestock', parent: 'agriculture', sortOrder: 2 },
    { slug: 'agri-tech', name: 'Agri-tech', parent: 'agriculture', sortOrder: 3 },
    // Multimedia
    { slug: 'video', name: 'Video', parent: 'multimedia', sortOrder: 1 },
    { slug: 'podcasts', name: 'Podcasts', parent: 'multimedia', sortOrder: 2 },
    { slug: 'galleries', name: 'Photo Galleries', parent: 'multimedia', sortOrder: 3 },
    { slug: 'data', name: 'Data & Interactives', parent: 'multimedia', sortOrder: 4 },
    // Notices
    { slug: 'tenders', name: 'Tenders', parent: 'notices', sortOrder: 1 },
    { slug: 'obituaries', name: 'Obituaries', parent: 'notices', sortOrder: 2 },
    { slug: 'public-notices', name: 'Public Notices', parent: 'notices', sortOrder: 3 },
    { slug: 'announcements', name: 'Announcements', parent: 'notices', sortOrder: 4 },
    { slug: 'jobs', name: 'Jobs', parent: 'notices', sortOrder: 5 },
  ];

  const bySlug: Record<string, { id: string }> = {};
  for (const section of topSections) {
    bySlug[section.slug] = await prisma.category.upsert({
      where: { slug: section.slug },
      update: { name: section.name, sortOrder: section.sortOrder, parentId: null },
      create: section,
    });
  }
  for (const sub of subSections) {
    const parentId = bySlug[sub.parent].id;
    bySlug[sub.slug] = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, parentId, sortOrder: sub.sortOrder },
      create: { slug: sub.slug, name: sub.name, parentId, sortOrder: sub.sortOrder },
    });
  }

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
      category: 'startups',
      readTimeMin: 5,
      daysAgo: 1,
    },
    {
      slug: 'east-african-trade-corridor-upgrade',
      title: 'East African trade corridor upgrade nears completion',
      subtitle: 'Faster freight promises lower costs for landlocked economies.',
      excerpt:
        'Officials say the corridor will cut transit times between the coast and Kigali significantly.',
      category: 'east-africa',
      readTimeMin: 6,
      daysAgo: 2,
    },
    {
      slug: 'amavubi-name-squad-for-qualifier',
      title: 'Amavubi name squad for crucial qualifier',
      subtitle: 'The national side face a decisive fixture at Amahoro Stadium.',
      excerpt: 'The coach recalls two overseas-based players ahead of the weekend clash.',
      category: 'football',
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
      category: 'kigali',
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
    const blocks = flagshipBlocks[a.slug] ?? genericBlocks(a);
    const data = {
      slug: a.slug,
      title: a.title,
      subtitle: a.subtitle,
      excerpt: a.excerpt,
      // The structured document is the source of truth; the plain body (search /
      // excerpt / preview) is derived from it, mirroring the CMS write path.
      blocks: blocks as unknown as Prisma.InputJsonValue,
      body: plainTextFromBlocks(blocks),
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

  // Topics (followable subjects) + article tags (documents/14 §5.2).
  const topicDefs: { slug: string; name: string; description: string }[] = [
    {
      slug: 'specialty-coffee',
      name: 'Specialty coffee',
      description: 'Rwanda’s specialty coffee — growers, washing stations, and the export market.',
    },
    { slug: 'exports', name: 'Exports', description: 'Rwanda’s export trade and earnings.' },
    {
      slug: 'startups',
      name: 'Startups',
      description: 'The ventures and founders building from Rwanda.',
    },
    {
      slug: 'kigali-innovation-city',
      name: 'Kigali Innovation City',
      description: 'The campus positioning Kigali as a regional tech hub.',
    },
    {
      slug: 'afcfta',
      name: 'AfCFTA',
      description: 'The African Continental Free Trade Area and regional integration.',
    },
    { slug: 'amavubi', name: 'Amavubi', description: 'Rwanda’s national football team.' },
    {
      slug: 'monetary-policy',
      name: 'Monetary policy',
      description: 'The central bank, interest rates, and inflation.',
    },
    {
      slug: 'climate',
      name: 'Climate',
      description: 'Climate, clean energy, and the environment.',
    },
  ];
  const topicBySlug: Record<string, { id: string }> = {};
  for (const t of topicDefs) {
    topicBySlug[t.slug] = await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { name: t.name, description: t.description },
      create: t,
    });
  }

  const articleTopics: Record<string, string[]> = {
    'rwanda-coffee-exports-hit-record-high': ['specialty-coffee', 'exports'],
    'kigali-innovation-city-adds-startups': ['startups', 'kigali-innovation-city'],
    'east-african-trade-corridor-upgrade': ['afcfta', 'exports'],
    'amavubi-name-squad-for-qualifier': ['amavubi'],
    'central-bank-holds-key-rate': ['monetary-policy'],
    'kigali-green-transport-plan': ['climate'],
  };
  for (const [slug, topicSlugs] of Object.entries(articleTopics)) {
    const article = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (!article) continue;
    await prisma.articleTopic.createMany({
      data: topicSlugs.map((ts) => ({ articleId: article.id, topicId: topicBySlug[ts].id })),
      skipDuplicates: true,
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
