/**
 * A case-insensitive title/description `contains` filter for the multimedia
 * hubs' search box, or `{}` when there's nothing to search on. A one-character
 * query is ignored — it would match almost everything and isn't a real search.
 * Spread into a Prisma `where` (`{ ...textFilter(q) }`).
 */
export function textFilter(q?: string): { OR?: object[] } {
  const term = q?.trim();
  if (!term || term.length < 2) return {};
  const match = { contains: term, mode: 'insensitive' as const };
  return { OR: [{ title: match }, { description: match }] };
}
