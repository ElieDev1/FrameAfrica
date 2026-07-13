import type { PrismaService } from '../prisma/prisma.service';
import { slugify } from './slug';

/**
 * The `/author/<slug>` handle for a new account, unique across users.
 *
 * Every account gets one at creation — a reader who is later hired as a
 * journalist should not need a data fix to get a byline page. The slug is
 * assigned once and never follows a later rename: a URL that has been shared or
 * indexed must keep working.
 */
export async function uniqueAuthorSlug(
  prisma: PrismaService,
  displayName: string,
): Promise<string> {
  const base = slugify(displayName) || 'author';

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.user.findUnique({
      where: { authorSlug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }

  // 25 people with the same name is not a real case, but a collision here would
  // fail the whole signup — so fall back to something that cannot collide.
  return `${base}-${Date.now().toString(36)}`;
}
