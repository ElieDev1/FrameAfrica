// Frame Africa — development seed data.
// Idempotent: re-running upserts the same rows. Run with `pnpm db:seed`.

import {
  ArticleLanguage,
  ArticleStatus,
  EngagementTarget,
  Prisma,
  PrismaClient,
  RoleName,
} from '@prisma/client';
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
  'rwanda-economy-grows-eight-percent': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Rwanda’s economy expanded by about 8% over the quarter, one of the faster rates in the region, as services, construction and agriculture all pulled in the same direction.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The headline figure was lifted by a rebound in tourism and hospitality, sustained public investment in roads and housing, and a solid farming season that kept food supply steady.',
    },
    { type: 'heading', level: 2, text: 'Where the growth came from' },
    {
      type: 'paragraph',
      text: 'Services remained the largest contributor, but construction posted the sharpest acceleration, reflecting a pipeline of public and private projects across the capital and secondary cities.',
    },
    {
      type: 'pullquote',
      text: 'The task now is to turn a good quarter into a durable decade.',
      attribution: 'Kigali-based economist',
    },
    {
      type: 'factbox',
      title: 'By the numbers',
      body: 'Services led the expansion, followed by construction and agriculture. Economists say sustaining the pace will depend on private investment and skills.',
    },
  ],
  'bk-group-posts-record-annual-profit': [
    {
      type: 'paragraph',
      lede: true,
      text: 'BK Group reported a record annual profit, powered by a growing loan book, disciplined cost control and a decisive shift of customers onto digital channels.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Management said the bulk of transactions now run through mobile and online platforms, trimming branch costs while extending services to customers outside the main cities.',
    },
    { type: 'heading', level: 2, text: 'Quality of the book' },
    {
      type: 'paragraph',
      text: 'Executives pointed to a contained non-performing-loan ratio as evidence that lending growth had not come at the expense of asset quality.',
    },
    {
      type: 'factbox',
      title: 'Why it matters',
      body: 'As the country’s largest lender, the group’s results are a useful barometer of business confidence and household borrowing.',
    },
  ],
  'kigali-fintech-raises-series-a': [
    {
      type: 'paragraph',
      lede: true,
      text: 'A Kigali-based fintech has closed one of the largest Series A rounds yet for an early-stage Rwandan startup, capital it will use to scale cross-border payments across East Africa.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The company plans to grow its merchant network and hire across engineering and compliance, betting that simpler regional payments can unlock trade for small businesses.',
    },
    { type: 'heading', level: 2, text: 'The regional bet' },
    {
      type: 'paragraph',
      text: 'Founders framed the raise as a vote of confidence in Kigali’s deepening talent pool and in a regulatory environment that has courted financial-technology firms.',
    },
    {
      type: 'pullquote',
      text: 'The opportunity is regional; the base is Kigali.',
      attribution: 'Company co-founder',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Rwanda has positioned itself as a proving ground for fintech, with a supportive regulator and a fast-modernising payments system.',
    },
  ],
  'mobile-money-interoperability-goes-live': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Mobile-money customers can now send funds directly between wallets on different networks, removing a friction point that has long forced awkward workarounds.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The interoperability switch means a payment from one operator’s wallet lands in another’s in seconds, a change expected to boost everyday digital transactions.',
    },
    { type: 'heading', level: 2, text: 'What changes for users' },
    {
      type: 'list',
      style: 'bullet',
      items: [
        'Direct wallet-to-wallet transfers across networks',
        'Fewer cash-out and re-deposit steps',
        'Lower friction for small merchants',
      ],
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Mobile money is the backbone of everyday finance for millions; interoperability is a long-sought upgrade for the ecosystem.',
    },
  ],
  'kigali-bus-rapid-transit-breaks-ground': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Kigali has broken ground on a bus rapid transit network, with dedicated lanes designed to move commuters faster along the city’s most congested corridors.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The first phase links the central business district with fast-growing residential districts, and pairs the lanes with upgraded stops and cleaner buses.',
    },
    { type: 'heading', level: 2, text: 'A mobility reset' },
    {
      type: 'paragraph',
      text: 'Planners say reliable, high-capacity transit is essential as the population grows, and that priority lanes are the quickest way to cut journey times.',
    },
    {
      type: 'factbox',
      title: 'The plan',
      body: 'The BRT complements the city’s wider green-mobility push, including electric buses and expanded cycle lanes.',
    },
  ],
  'eac-lays-out-single-currency-roadmap': [
    {
      type: 'paragraph',
      lede: true,
      text: 'East African Community member states have agreed a roadmap toward a single currency, setting convergence targets that must be met before any monetary union.',
    },
    {
      type: 'paragraph',
      text: 'ARUSHA — Negotiators said harmonising inflation, deficits and debt across economies of very different sizes remains the central challenge.',
    },
    { type: 'heading', level: 2, text: 'The road ahead' },
    {
      type: 'paragraph',
      text: 'Officials cautioned that timelines have slipped before, and that credibility now rests on hitting the agreed benchmarks rather than on new declarations.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'A single currency is a long-standing EAC ambition intended to deepen trade and cut transaction costs across the bloc.',
    },
  ],
  'afcfta-lifts-rwandan-manufactured-exports': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Rwandan manufacturers are reaching new buyers deeper into the continent under the African Continental Free Trade Area, with fresh orders from West and Southern Africa.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Firms in processed foods, building materials and light manufacturing say preferential access is making their goods competitive in markets once out of reach.',
    },
    { type: 'heading', level: 2, text: 'From access to advantage' },
    {
      type: 'paragraph',
      text: 'Exporters said the next test is logistics — getting goods to distant markets quickly and affordably — as much as tariffs.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'AfCFTA aims to create a single continental market; Rwanda has been an early and vocal backer of the pact.',
    },
  ],
  'amavubi-hold-rivals-in-tense-draw': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Amavubi ground out a disciplined draw against their rivals, a resilient defensive display that keeps Rwanda’s qualifying campaign alive.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Backed by a lively crowd at Amahoro Stadium, the national side soaked up pressure and threatened on the break before holding on for a share of the points.',
    },
    { type: 'heading', level: 2, text: 'Still to play for' },
    {
      type: 'paragraph',
      text: 'The result leaves the group finely poised, with qualification set to be decided on the final matchday.',
    },
    {
      type: 'factbox',
      title: 'What’s next',
      body: 'Rwanda travel for their concluding fixture knowing a win could be enough to progress.',
    },
  ],
  'kigali-hosts-basketball-africa-league': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Kigali Arena will host the Basketball Africa League playoffs, bringing the continent’s top clubs back to the capital for the showpiece weekend.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Organisers expect sell-out crowds, building on the city’s growing reputation as a host of major continental sporting events.',
    },
    { type: 'heading', level: 2, text: 'A stage for the game' },
    {
      type: 'paragraph',
      text: 'The BAL has leaned on Kigali’s modern arena and hospitality since the league’s early seasons, and the finals are its biggest draw yet.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'The league, backed by continental and international basketball bodies, showcases Africa’s best club sides.',
    },
  ],
  'tour-du-rwanda-unveils-mountain-route': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Organisers of the Tour du Rwanda have unveiled a demanding new route, with a queen stage over the Congo Nile Divide that will reward the strongest climbers.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The parcours builds on the momentum of Kigali’s staging of the road cycling world championships, which put the country’s climbs on the global map.',
    },
    { type: 'heading', level: 2, text: 'Made for climbers' },
    {
      type: 'paragraph',
      text: 'Teams said the relentless gradients and altitude will make the race one of the toughest on the African calendar.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'The Tour du Rwanda is one of Africa’s premier stage races, drawing continental and international teams each season.',
    },
  ],
  'rwandan-runner-sets-national-record': [
    {
      type: 'paragraph',
      lede: true,
      text: 'A Rwandan runner has set a national record on the road, a breakthrough that signals a bright future for the country’s distance running.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The athlete credited a new high-altitude training base and a more structured racing calendar for the leap in form.',
    },
    { type: 'heading', level: 2, text: 'Building a programme' },
    {
      type: 'paragraph',
      text: 'Coaches said the performance reflects growing investment in grassroots athletics and better access to competition abroad.',
    },
    {
      type: 'factbox',
      title: 'What’s next',
      body: 'Selectors will watch upcoming races as the athlete targets continental championships.',
    },
  ],
  'lake-kivu-methane-powers-the-grid': [
    {
      type: 'paragraph',
      lede: true,
      text: 'A project extracting methane dissolved deep in Lake Kivu is feeding steady power into the national grid, turning a natural hazard into a reliable resource.',
    },
    {
      type: 'paragraph',
      text: 'KARONGI — The plant draws gas-rich water from the depths, separates the methane and burns it to generate electricity, then returns the water safely.',
    },
    { type: 'heading', level: 2, text: 'Hazard into resource' },
    {
      type: 'paragraph',
      text: 'Engineers said controlled extraction also reduces the lake’s dangerous long-term gas build-up, a rare case of energy and safety pulling together.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Lake Kivu holds vast quantities of dissolved gas; managed extraction offers baseload power for a growing economy.',
    },
  ],
  'akagera-lion-population-rebounds': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Lions are thriving again in Akagera National Park, a decade after the predator was reintroduced to a landscape it had vanished from.',
    },
    {
      type: 'paragraph',
      text: 'AKAGERA — Rangers report a healthy, breeding population, the result of tighter security, community partnership and careful wildlife management.',
    },
    { type: 'heading', level: 2, text: 'A model that holds' },
    {
      type: 'paragraph',
      text: 'Conservationists say the recovery has helped make the park financially self-sustaining, with tourism revenue flowing back to nearby communities.',
    },
    {
      type: 'pullquote',
      text: 'When communities benefit, wildlife recovers.',
      attribution: 'Park conservation lead',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Akagera’s turnaround is often cited as a template for community-backed conservation in the region.',
    },
  ],
  'gishwati-reforestation-hits-milestone': [
    {
      type: 'paragraph',
      lede: true,
      text: 'A long-running effort to restore the Gishwati forest has hit a milestone, with native tree cover returning to hillsides once stripped bare.',
    },
    {
      type: 'paragraph',
      text: 'RUTSIRO — The restored canopy is drawing back birds and small mammals and helping to stabilise watersheds that feed farms downstream.',
    },
    { type: 'heading', level: 2, text: 'Roots and water' },
    {
      type: 'paragraph',
      text: 'Ecologists said reforestation is also reducing landslides and erosion on the steep terrain, protecting both people and soil.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'The Gishwati-Mukura landscape is a recognised biosphere reserve and a focus of national restoration goals.',
    },
  ],
  'community-health-insurance-widens-cover': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Enrolment in community health insurance is climbing, with digital payments making it easier for rural families to keep their cover current.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Officials say wider coverage is cutting out-of-pocket costs and helping the most vulnerable households reach care sooner.',
    },
    { type: 'heading', level: 2, text: 'Cover that reaches further' },
    {
      type: 'paragraph',
      text: 'Health workers report that predictable insurance is encouraging earlier visits, easing pressure on hospitals down the line.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Community-based health insurance has been central to expanding access to care across the country.',
    },
  ],
  'university-enrollment-climbs-in-stem': [
    {
      type: 'paragraph',
      lede: true,
      text: 'University enrolment is rising, led by strong demand for science, technology, engineering and mathematics programmes.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Scholarships, new campuses and closer ties with industry are widening access and steering students toward high-demand fields.',
    },
    { type: 'heading', level: 2, text: 'Matching skills to jobs' },
    {
      type: 'paragraph',
      text: 'Employers welcomed the shift but urged more hands-on training so graduates arrive job-ready.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'A larger STEM pipeline is seen as essential to the country’s ambitions in technology and services.',
    },
  ],
  'strong-maize-harvest-eases-food-prices': [
    {
      type: 'paragraph',
      lede: true,
      text: 'A strong maize harvest is easing food prices in local markets, as favourable rains and improved seed lifted yields this season.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — Traders report steadier supply as the main-season crop reaches storage, giving households some relief at the market.',
    },
    { type: 'heading', level: 2, text: 'From field to market' },
    {
      type: 'paragraph',
      text: 'Agronomists said better post-harvest storage will be key to locking in the gains and reducing waste.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Maize is a staple across the region; harvest swings feed directly into food-price inflation.',
    },
  ],
  'rwanda-tourism-revenue-hits-record': [
    {
      type: 'paragraph',
      lede: true,
      text: 'Tourism revenue has hit a record, driven by a surge in business events and premium wildlife experiences led by gorilla trekking.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The meetings-and-conferences segment filled hotels midweek, while high-value trekking permits sustained earnings from the parks.',
    },
    { type: 'heading', level: 2, text: 'A high-value strategy' },
    {
      type: 'paragraph',
      text: 'Officials said the country’s bet on quality over volume is paying off, spreading benefits to communities near the parks.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Rwanda markets itself as a premium destination, pairing conservation-funded wildlife tourism with a growing MICE sector.',
    },
  ],
  'kigali-music-festival-returns': [
    {
      type: 'paragraph',
      lede: true,
      text: 'A flagship Kigali music festival returns with a pan-African line-up, putting home-grown talent alongside continental headliners.',
    },
    {
      type: 'paragraph',
      text: 'KIGALI — The weekend caps a busy season for a local creative economy that is drawing new audiences and investment.',
    },
    { type: 'heading', level: 2, text: 'A scene on the rise' },
    {
      type: 'paragraph',
      text: 'Artists said bigger stages at home are helping them build careers without having to leave the country.',
    },
    {
      type: 'factbox',
      title: 'The context',
      body: 'Live events are a growing pillar of the creative economy, supporting musicians, venues and hospitality.',
    },
  ],
  'editorial-invest-in-skills-now': [
    {
      type: 'paragraph',
      lede: true,
      text: 'The economy’s momentum is real — but it will stall unless it is matched by a serious, sustained investment in skills.',
    },
    {
      type: 'paragraph',
      text: 'Growth in services, construction and technology is generating jobs faster than the workforce can fill them with the right training. That gap is the single biggest risk to the next decade.',
    },
    { type: 'heading', level: 2, text: 'Turn classrooms into careers' },
    {
      type: 'paragraph',
      text: 'That means practical, industry-linked training; more places in STEM and the trades; and support so students can finish. The payoff — a workforce ready for higher-value work — is worth the price.',
    },
    {
      type: 'factbox',
      title: 'Our view',
      body: 'Skills, not slogans, will decide whether today’s growth becomes tomorrow’s prosperity.',
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

interface SeedArticle {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  isBreaking?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  /** True when no cover art is bundled — renders the branded placeholder. */
  noCover?: boolean;
  readTimeMin: number;
  daysAgo: number;
  /** Pre-built block document (generated articles); else derived below. */
  blocks?: Block[];
  /** Pre-set view count (generated articles); else from the `views` map. */
  views?: number;
}

/**
 * Bulk generator for a large, realistic corpus across every category — useful
 * for exercising pagination, section pages, "load more", and Most-read. Content
 * is deterministic (stable slugs → idempotent re-seed) but varied: each article
 * gets its own multi-block document from rotating subjects, angles and places.
 */
function buildGeneratedArticles(): SeedArticle[] {
  const beats: { category: string; noun: string; subjects: string[] }[] = [
    {
      category: 'rwanda',
      noun: 'the country',
      subjects: [
        'national service delivery',
        'the new district plans',
        'civil registration',
        'rural electrification',
        'the housing programme',
      ],
    },
    {
      category: 'kigali',
      noun: 'the capital',
      subjects: [
        'city traffic',
        'affordable housing',
        'the night economy',
        'waste recycling',
        'street lighting',
      ],
    },
    {
      category: 'east-africa',
      noun: 'the region',
      subjects: [
        'cross-border trade',
        'the shared power pool',
        'regional roaming',
        'a joint tourist visa',
        'the customs union',
      ],
    },
    {
      category: 'africa',
      noun: 'the continent',
      subjects: [
        'continental free trade',
        'a pan-African payments link',
        'youth employment',
        'regional airlines',
      ],
    },
    {
      category: 'world',
      noun: 'global markets',
      subjects: [
        'commodity prices',
        'shipping costs',
        'a diplomatic summit',
        'global interest rates',
      ],
    },
    {
      category: 'politics',
      noun: 'the sector',
      subjects: [
        'local governance',
        'public accountability',
        'a policy review',
        'service charters',
      ],
    },
    {
      category: 'diplomacy',
      noun: 'relations',
      subjects: ['a bilateral deal', 'a trade mission', 'a new embassy', 'a cooperation pact'],
    },
    {
      category: 'economy',
      noun: 'the economy',
      subjects: [
        'GDP growth',
        'inflation',
        'the franc',
        'public debt',
        'private investment',
        'the trade balance',
      ],
    },
    {
      category: 'markets',
      noun: 'markets',
      subjects: ['the stock exchange', 'treasury bonds', 'bank shares', 'commodity prices'],
    },
    {
      category: 'companies',
      noun: 'the firm',
      subjects: [
        'a factory expansion',
        'quarterly earnings',
        'a new product line',
        'a regional merger',
      ],
    },
    {
      category: 'banking-finance',
      noun: 'the lender',
      subjects: [
        'digital banking',
        'lending to SMEs',
        'the interest-rate outlook',
        'financial inclusion',
      ],
    },
    {
      category: 'agribusiness',
      noun: 'the sector',
      subjects: ['tea exports', 'cold-chain logistics', 'contract farming', 'food processing'],
    },
    {
      category: 'startups',
      noun: 'the startup scene',
      subjects: ['a seed round', 'a health startup', 'an agritech pilot', 'an accelerator cohort'],
    },
    {
      category: 'real-estate',
      noun: 'the market',
      subjects: ['office demand', 'affordable homes', 'mixed-use projects', 'construction costs'],
    },
    {
      category: 'personal-finance',
      noun: 'households',
      subjects: ['saving habits', 'digital wallets', 'micro-insurance', 'household budgets'],
    },
    {
      category: 'mobile',
      noun: 'mobile users',
      subjects: ['4G coverage', 'device prices', 'a data bundle war', 'handset financing'],
    },
    {
      category: 'internet',
      noun: 'connectivity',
      subjects: ['fibre rollout', 'broadband prices', 'rural access', 'a new data centre'],
    },
    {
      category: 'ai',
      noun: 'the field',
      subjects: [
        'a national AI strategy',
        'AI in health',
        'local language models',
        'AI skills training',
      ],
    },
    {
      category: 'fintech',
      noun: 'digital finance',
      subjects: ['mobile payments', 'a lending app', 'QR payments', 'cross-border transfers'],
    },
    {
      category: 'gadgets',
      noun: 'consumers',
      subjects: ['a phone launch', 'affordable laptops', 'wearables', 'e-readers'],
    },
    {
      category: 'football',
      noun: 'the game',
      subjects: [
        'the league title race',
        'a transfer swoop',
        'the national team',
        'a youth academy',
      ],
    },
    {
      category: 'athletics',
      noun: 'the sport',
      subjects: ['a road race', 'a national record', 'a training camp', 'a medal hope'],
    },
    {
      category: 'basketball',
      noun: 'the court',
      subjects: ['the playoffs', 'a marquee signing', 'the national side', 'a new arena fixture'],
    },
    {
      category: 'cycling',
      noun: 'the peloton',
      subjects: ['a mountain stage', 'a sprint finish', 'a new team', 'the race calendar'],
    },
    {
      category: 'volleyball',
      noun: 'the sport',
      subjects: ['a continental tie', 'a league final', 'a rising talent'],
    },
    {
      category: 'editorials',
      noun: 'the country',
      subjects: [
        'investing in skills',
        'protecting the franc',
        'greening the cities',
        'backing small business',
      ],
    },
    {
      category: 'op-eds',
      noun: 'the debate',
      subjects: [
        'the future of work',
        'regional integration',
        'climate adaptation',
        'the digital economy',
      ],
    },
    {
      category: 'columns',
      noun: 'the week',
      subjects: ['a view from Kigali', 'notes on the markets', 'the sporting weekend'],
    },
    {
      category: 'arts',
      noun: 'the scene',
      subjects: ['a new exhibition', 'a public mural', 'an artist residency'],
    },
    {
      category: 'music',
      noun: 'the industry',
      subjects: ['a festival line-up', 'a breakout artist', 'a live-music revival'],
    },
    {
      category: 'film-tv',
      noun: 'the screen',
      subjects: ['a local feature', 'a streaming deal', 'a film festival'],
    },
    {
      category: 'books',
      noun: 'readers',
      subjects: ['a debut novel', 'a book fair', 'a translation project'],
    },
    {
      category: 'food-drink',
      noun: 'the table',
      subjects: ['a new restaurant', 'coffee culture', 'farm-to-table dining'],
    },
    {
      category: 'fashion',
      noun: 'the runway',
      subjects: ['a design showcase', 'local textiles', 'a sustainable label'],
    },
    {
      category: 'travel',
      noun: 'tourism',
      subjects: ['gorilla trekking', 'lakeside resorts', 'conference tourism', 'a new trail'],
    },
    {
      category: 'lifestyle',
      noun: 'daily life',
      subjects: ['urban wellness', 'weekend escapes', 'home design'],
    },
    {
      category: 'public-health',
      noun: 'public health',
      subjects: ['a vaccination drive', 'malaria control', 'health insurance', 'maternal care'],
    },
    {
      category: 'wellness',
      noun: 'wellbeing',
      subjects: ['mental health', 'nutrition', 'active living'],
    },
    {
      category: 'medicine',
      noun: 'medicine',
      subjects: ['a new clinic', 'telemedicine', 'a research study'],
    },
    {
      category: 'climate',
      noun: 'the climate',
      subjects: [
        'flood defences',
        'a reforestation drive',
        'climate finance',
        'drought resilience',
      ],
    },
    {
      category: 'conservation',
      noun: 'conservation',
      subjects: ['a wildlife census', 'anti-poaching work', 'a protected wetland'],
    },
    {
      category: 'energy',
      noun: 'the grid',
      subjects: ['solar mini-grids', 'a hydro plant', 'clean cooking', 'grid expansion'],
    },
    {
      category: 'schools',
      noun: 'schools',
      subjects: ['a new curriculum', 'school feeding', 'digital classrooms'],
    },
    {
      category: 'higher-education',
      noun: 'campuses',
      subjects: ['research funding', 'STEM enrolment', 'a new campus', 'industry links'],
    },
    {
      category: 'skills',
      noun: 'the workforce',
      subjects: ['vocational training', 'a coding bootcamp', 'apprenticeships'],
    },
    {
      category: 'crops',
      noun: 'farmers',
      subjects: ['the maize harvest', 'improved seed', 'irrigation', 'post-harvest storage'],
    },
    {
      category: 'livestock',
      noun: 'herders',
      subjects: ['dairy output', 'animal health', 'a breeding programme'],
    },
    {
      category: 'agri-tech',
      noun: 'the field',
      subjects: ['farm sensors', 'a market app', 'drone spraying'],
    },
    {
      category: 'science',
      noun: 'researchers',
      subjects: ['a research grant', 'a lab opening', 'a space partnership'],
    },
  ];

  const angles = [
    'climbs as demand firms',
    'steadies after a volatile stretch',
    'draws fresh investment',
    'enters a decisive phase',
    'tops earlier forecasts',
    'gets a policy boost',
    'sparks debate among experts',
    'shows signs of a turnaround',
  ];
  const places = [
    'KIGALI',
    'MUSANZE',
    'HUYE',
    'RUBAVU',
    'NYAGATARE',
    'KARONGI',
    'MUHANGA',
    'NAIROBI',
    'KAMPALA',
    'ADDIS ABABA',
  ];
  const headings = [
    'Why it matters',
    'What happens next',
    'The bigger picture',
    'Behind the numbers',
    'Reaction',
    'On the ground',
  ];
  const bodyBank = [
    'Officials and industry figures said the shift had been building for months, and that its effects were now visible across {noun}.',
    'Analysts were cautiously optimistic, noting that follow-through over the coming quarters would determine how durable the change proves.',
    'For many, the practical question is simpler: whether the gains reach households and small businesses, not just headline figures.',
    'Partners across the region are watching closely, with several signalling interest in deeper cooperation if momentum holds.',
    'Supporters framed it as a step in the right direction; sceptics urged patience and better data before drawing conclusions.',
  ];

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  // Small deterministic hash for stable pseudo-random values from a slug.
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
    return h;
  };

  const PER_CATEGORY = 6;
  const out: SeedArticle[] = [];
  for (const beat of beats) {
    for (let i = 0; i < PER_CATEGORY; i++) {
      const subject = beat.subjects[i % beat.subjects.length];
      const angle = angles[(i + hash(beat.category)) % angles.length];
      const place = places[(i + hash(subject)) % places.length];
      const heading = headings[i % headings.length];
      const slug = `${beat.category}-${subject.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${i + 1}`;
      const title = `${cap(subject)} ${angle}`;
      const subtitle = `A closer look at what is driving ${subject} and who stands to gain.`;
      const excerpt = `${cap(subject)} ${angle}, as officials and analysts weigh the implications for ${beat.noun} and the wider region.`;
      const h = hash(slug);
      const b1 = bodyBank[h % bodyBank.length].replace('{noun}', beat.noun);
      const b2 = bodyBank[(h + 2) % bodyBank.length].replace('{noun}', beat.noun);
      const blocks: Block[] = [
        { type: 'paragraph', lede: true, text: excerpt },
        {
          type: 'paragraph',
          text: `${place} — The developments came into focus this week, drawing reaction from officials, businesses and residents with a stake in ${subject}.`,
        },
        { type: 'heading', level: 2, text: heading },
        { type: 'paragraph', text: b1 },
        { type: 'paragraph', text: b2 },
        {
          type: 'factbox',
          title: 'The context',
          body: `${cap(subject)} sits within ${beat.noun}, a space policymakers and the private sector have flagged as central to the next phase of growth.`,
        },
        { type: 'paragraph', text: 'More reporting to follow as the story develops.' },
      ];
      out.push({
        slug,
        title,
        subtitle,
        excerpt,
        category: beat.category,
        isBreaking: h % 23 === 0,
        isPremium: h % 11 === 0,
        isFeatured: h % 37 === 0,
        noCover: true,
        readTimeMin: 3 + (h % 4),
        daysAgo: 1 + (h % 60),
        blocks,
        views: 200 + (h % 5000),
      });
    }
  }
  return out;
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
      // The public byline handle. Without it a freshly seeded database gives every
      // author a null slug, and /author/<slug> doesn't exist at all.
      authorSlug: 'jane-uwase',
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
      // The public byline handle. Without it a freshly seeded database gives every
      // author a null slug, and /author/<slug> doesn't exist at all.
      authorSlug: 'eric-mugisha',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: editor.id, roleId: editorRole.id } },
    update: {},
    create: { userId: editor.id, roleId: editorRole.id },
  });

  // An admin, with full access to every workspace (users, settings, etc.).
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.admin },
    update: {},
    create: { name: RoleName.admin },
  });
  const admin = await prisma.user.upsert({
    where: { email: 'admin@frameafrica.rw' },
    update: { passwordHash },
    create: {
      email: 'admin@frameafrica.rw',
      displayName: 'Site Admin',
      // The public byline handle. Without it a freshly seeded database gives every
      // author a null slug, and /author/<slug> doesn't exist at all.
      authorSlug: 'site-admin',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  // A second admin account (so one can be kept free for testing/handover).
  const adminTwo = await prisma.user.upsert({
    where: { email: 'newsroom.admin@frameafrica.rw' },
    update: { passwordHash },
    create: {
      email: 'newsroom.admin@frameafrica.rw',
      displayName: 'Newsroom Admin',
      // The public byline handle. Without it a freshly seeded database gives every
      // author a null slug, and /author/<slug> doesn't exist at all.
      authorSlug: 'newsroom-admin',
      emailVerifiedAt: new Date(),
      passwordHash,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminTwo.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminTwo.id, roleId: adminRole.id },
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

  const articles: SeedArticle[] = [
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

    // ── Additional newsroom stories ──────────────────────────────────────────
    {
      slug: 'rwanda-economy-grows-eight-percent',
      title: 'Rwanda’s economy grows 8% as services and construction lead',
      subtitle: 'Strong tourism receipts and public investment underpinned the expansion.',
      excerpt:
        'Growth was broad-based, with services, construction and agriculture all contributing to the quarter’s gains.',
      category: 'economy',
      isFeatured: true,
      noCover: true,
      readTimeMin: 5,
      daysAgo: 0,
    },
    {
      slug: 'bk-group-posts-record-annual-profit',
      title: 'BK Group posts record annual profit on lending growth',
      subtitle: 'The lender expanded its loan book while keeping non-performing loans in check.',
      excerpt:
        'Digital channels now handle the vast majority of transactions, trimming costs and widening reach.',
      category: 'banking-finance',
      isPremium: true,
      noCover: true,
      readTimeMin: 4,
      daysAgo: 1,
    },
    {
      slug: 'kigali-fintech-raises-series-a',
      title: 'Kigali fintech raises Series A to scale cross-border payments',
      subtitle: 'The round is one of the largest for an early-stage Rwandan startup.',
      excerpt:
        'The company plans to expand its merchant network across the East African Community with the new funding.',
      category: 'startups',
      isBreaking: true,
      isFeatured: true,
      noCover: true,
      readTimeMin: 4,
      daysAgo: 1,
    },
    {
      slug: 'mobile-money-interoperability-goes-live',
      title: 'Mobile-money interoperability goes live across networks',
      subtitle: 'Customers can now send money directly between different wallets.',
      excerpt:
        'The switch removes a long-standing friction point for millions of mobile-money users nationwide.',
      category: 'fintech',
      noCover: true,
      readTimeMin: 3,
      daysAgo: 2,
    },
    {
      slug: 'kigali-bus-rapid-transit-breaks-ground',
      title: 'Kigali breaks ground on bus rapid transit network',
      subtitle: 'Dedicated lanes aim to cut commutes on the city’s busiest corridors.',
      excerpt:
        'The first phase links the central business district with fast-growing residential districts.',
      category: 'kigali',
      isFeatured: true,
      noCover: true,
      readTimeMin: 4,
      daysAgo: 2,
    },
    {
      slug: 'eac-lays-out-single-currency-roadmap',
      title: 'East African Community lays out single-currency roadmap',
      subtitle: 'Member states agree on convergence targets ahead of a monetary union.',
      excerpt:
        'Officials say harmonised inflation and fiscal rules are the next hurdle for the bloc.',
      category: 'east-africa',
      noCover: true,
      readTimeMin: 6,
      daysAgo: 3,
    },
    {
      slug: 'afcfta-lifts-rwandan-manufactured-exports',
      title: 'AfCFTA lifts Rwandan manufactured exports to new markets',
      subtitle: 'Locally made goods are reaching buyers deeper into the continent.',
      excerpt:
        'Manufacturers report new orders from West and Southern Africa under the free-trade area.',
      category: 'africa',
      noCover: true,
      readTimeMin: 5,
      daysAgo: 3,
    },
    {
      slug: 'amavubi-hold-rivals-in-tense-draw',
      title: 'Amavubi hold rivals in tense qualifier draw',
      subtitle: 'A resilient defensive display keeps Rwanda’s campaign alive.',
      excerpt: 'The point leaves the group finely balanced ahead of the final round of fixtures.',
      category: 'football',
      isBreaking: true,
      noCover: true,
      readTimeMin: 3,
      daysAgo: 1,
    },
    {
      slug: 'kigali-hosts-basketball-africa-league',
      title: 'Kigali Arena to host Basketball Africa League playoffs',
      subtitle: 'The continent’s top clubs return to the capital for the finals.',
      excerpt: 'Organisers expect sell-out crowds as the BAL’s showpiece weekend comes to Kigali.',
      category: 'basketball',
      noCover: true,
      readTimeMin: 3,
      daysAgo: 4,
    },
    {
      slug: 'tour-du-rwanda-unveils-mountain-route',
      title: 'Tour du Rwanda unveils demanding new mountain route',
      subtitle: 'Climbers will relish a queen stage through the Congo Nile Divide.',
      excerpt:
        'The race builds on the momentum of Kigali’s staging of the road cycling world championships.',
      category: 'cycling',
      noCover: true,
      readTimeMin: 4,
      daysAgo: 5,
    },
    {
      slug: 'rwandan-runner-sets-national-record',
      title: 'Rwandan runner sets national record on the road',
      subtitle: 'A breakthrough performance signals a bright distance-running future.',
      excerpt: 'The athlete credited a new high-altitude training base for the leap in form.',
      category: 'athletics',
      noCover: true,
      readTimeMin: 3,
      daysAgo: 6,
    },
    {
      slug: 'lake-kivu-methane-powers-the-grid',
      title: 'Lake Kivu methane project adds steady power to the grid',
      subtitle: 'Extracting dissolved gas turns a natural hazard into electricity.',
      excerpt:
        'The plant provides reliable baseload while reducing the lake’s dangerous gas build-up.',
      category: 'energy',
      isPremium: true,
      noCover: true,
      readTimeMin: 6,
      daysAgo: 5,
    },
    {
      slug: 'akagera-lion-population-rebounds',
      title: 'Akagera lion population rebounds a decade after reintroduction',
      subtitle: 'Careful management has restored a predator once lost to the park.',
      excerpt: 'Conservationists say the recovery is a milestone for community-backed tourism.',
      category: 'conservation',
      isFeatured: true,
      noCover: true,
      readTimeMin: 5,
      daysAgo: 6,
    },
    {
      slug: 'gishwati-reforestation-hits-milestone',
      title: 'Gishwati reforestation drive hits a green milestone',
      subtitle: 'Native tree cover returns to once-degraded hillsides.',
      excerpt: 'The restored landscape is drawing back wildlife and stabilising vital watersheds.',
      category: 'climate',
      noCover: true,
      readTimeMin: 4,
      daysAgo: 7,
    },
    {
      slug: 'community-health-insurance-widens-cover',
      title: 'Community health insurance widens cover for rural families',
      subtitle: 'Enrolment climbs as digital payments simplify contributions.',
      excerpt:
        'Officials say wider cover is easing out-of-pocket costs for the most vulnerable households.',
      category: 'public-health',
      noCover: true,
      readTimeMin: 4,
      daysAgo: 8,
    },
    {
      slug: 'university-enrollment-climbs-in-stem',
      title: 'University enrolment climbs, led by STEM programmes',
      subtitle: 'Scholarships and new campuses widen access to higher education.',
      excerpt: 'Demand for engineering, data and health sciences is reshaping campus intakes.',
      category: 'higher-education',
      noCover: true,
      readTimeMin: 4,
      daysAgo: 9,
    },
    {
      slug: 'strong-maize-harvest-eases-food-prices',
      title: 'Strong maize harvest eases food prices in local markets',
      subtitle: 'Favourable rains and better seed lifted yields this season.',
      excerpt: 'Traders report steadier supply as the main-season harvest reaches storage.',
      category: 'crops',
      noCover: true,
      readTimeMin: 3,
      daysAgo: 10,
    },
    {
      slug: 'rwanda-tourism-revenue-hits-record',
      title: 'Rwanda tourism revenue hits record on conferences and gorillas',
      subtitle: 'Business events and premium wildlife visits drove the rebound.',
      excerpt:
        'The MICE segment and high-value gorilla trekking led a record year for tourism receipts.',
      category: 'travel',
      isFeatured: true,
      noCover: true,
      readTimeMin: 5,
      daysAgo: 11,
    },
    {
      slug: 'kigali-music-festival-returns',
      title: 'Kigali music festival returns with a pan-African line-up',
      subtitle: 'Home-grown talent shares the stage with continental headliners.',
      excerpt: 'The festival caps a busy season for a fast-growing local creative economy.',
      category: 'music',
      noCover: true,
      readTimeMin: 3,
      daysAgo: 12,
    },
    {
      slug: 'editorial-invest-in-skills-now',
      title: 'Editorial: invest in skills now to secure the next decade',
      subtitle: 'The economy’s momentum must be matched by a serious skills push.',
      excerpt: 'Sustained growth depends on turning today’s classrooms into tomorrow’s workforce.',
      category: 'editorials',
      noCover: true,
      readTimeMin: 4,
      daysAgo: 13,
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
    'rwanda-economy-grows-eight-percent': 6100,
    'bk-group-posts-record-annual-profit': 2200,
    'kigali-fintech-raises-series-a': 4800,
    'mobile-money-interoperability-goes-live': 3900,
    'kigali-bus-rapid-transit-breaks-ground': 5200,
    'eac-lays-out-single-currency-roadmap': 1600,
    'afcfta-lifts-rwandan-manufactured-exports': 1400,
    'amavubi-hold-rivals-in-tense-draw': 7300,
    'kigali-hosts-basketball-africa-league': 4100,
    'tour-du-rwanda-unveils-mountain-route': 3300,
    'rwandan-runner-sets-national-record': 2900,
    'lake-kivu-methane-powers-the-grid': 2000,
    'akagera-lion-population-rebounds': 5900,
    'gishwati-reforestation-hits-milestone': 1500,
    'community-health-insurance-widens-cover': 1700,
    'university-enrollment-climbs-in-stem': 1300,
    'strong-maize-harvest-eases-food-prices': 1200,
    'rwanda-tourism-revenue-hits-record': 4600,
    'kigali-music-festival-returns': 3400,
    'editorial-invest-in-skills-now': 1100,
  };

  // Bulk corpus across every category (for pagination / section / most-read).
  articles.push(...buildGeneratedArticles());

  const now = Date.now();
  for (const a of articles) {
    const publishedAt = new Date(now - a.daysAgo * 24 * 60 * 60 * 1000);
    const blocks = a.blocks ?? flagshipBlocks[a.slug] ?? genericBlocks(a);
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
      isFeatured: a.isFeatured ?? false,
      featuredAt: a.isFeatured ? publishedAt : null,
      readTimeMin: a.readTimeMin,
      viewCount: BigInt(a.views ?? views[a.slug] ?? 0),
      // Bundled cover art under /public/seed (see documents/06 §6 — alt + credit
      // are required). Articles without bundled art render the branded
      // placeholder panel instead of a broken image.
      featuredImageUrl: a.noCover ? null : `/seed/${a.slug}.jpg`,
      featuredImageAlt: a.noCover ? null : a.title,
      featuredImageCredit: a.noCover ? null : 'Frame Africa',
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
      // The public byline handle. Without it a freshly seeded database gives every
      // author a null slug, and /author/<slug> doesn't exist at all.
      authorSlug: 'aline-u',
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
    // Comments are polymorphic now: `targetType`/`targetId` say what they hang off.
    const top = await prisma.comment.create({
      data: {
        targetType: EngagementTarget.article,
        targetId: coffee.id,
        articleId: coffee.id,
        authorId: reader.id,
        body: 'Great to see specialty demand rewarding smallholder growers.',
      },
    });
    await prisma.comment.create({
      data: {
        targetType: EngagementTarget.article,
        targetId: coffee.id,
        articleId: coffee.id,
        authorId: author.id,
        parentId: top.id,
        body: 'Agreed — the Western Province lots have been exceptional this season.',
      },
    });
  }

  // ── Site settings: the footer's social profiles and contact details ────────
  // Non-secret, admin-editable from Settings → Social profiles. Seeded so a
  // fresh environment renders a complete footer instead of an empty rail.
  const siteSettings: Record<string, string> = {
    SOCIAL_X_URL: 'https://x.com/frameafrica',
    SOCIAL_FACEBOOK_URL: 'https://facebook.com/frameafrica',
    SOCIAL_INSTAGRAM_URL: 'https://instagram.com/frameafrica',
    SOCIAL_YOUTUBE_URL: 'https://youtube.com/@frameafrica',
    SOCIAL_LINKEDIN_URL: 'https://linkedin.com/company/frameafrica',
    SOCIAL_TIKTOK_URL: 'https://tiktok.com/@frameafrica',
    SOCIAL_WHATSAPP_URL: 'https://wa.me/250788000000',
    CONTACT_EMAIL: 'hello@frameafrica.rw',
    CONTACT_PHONE: '+250 788 000 000',
  };
  for (const [key, value] of Object.entries(siteSettings)) {
    await prisma.appSetting.upsert({
      where: { key },
      update: {}, // never overwrite what an admin has already set
      create: { key, value, isSecret: false },
    });
  }

  // ── Subscription plans ────────────────────────────────────────────────────
  // What the paywall sells. Prices are in minor units; RWF has none, so the
  // figures below are francs.
  const plans = [
    {
      code: 'digital-monthly',
      name: 'Digital monthly',
      description: 'Unlimited access to every story, cancel any time.',
      priceCents: 5_000,
      interval: 'month' as const,
      sortOrder: 1,
    },
    {
      code: 'digital-annual',
      name: 'Digital annual',
      description: 'Two months free versus paying monthly.',
      priceCents: 50_000,
      interval: 'year' as const,
      sortOrder: 2,
    },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {}, // never overwrite prices an admin has set
      create: { ...plan, currency: 'RWF' },
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
