'use server';

import { fetchArticles, type ArticleSummary, type ListArticlesParams } from './api';

/**
 * Server action for "load more" on section/topic pages: fetches the next page
 * of articles (cursor-paginated) and returns them plus the following cursor.
 * Runs on the server so the API base URL / caching stay server-side.
 */
export async function fetchMoreArticles(
  params: ListArticlesParams,
): Promise<{ articles: ArticleSummary[]; nextCursor: string | null }> {
  const { articles, pagination } = await fetchArticles(params);
  return { articles, nextCursor: pagination?.nextCursor ?? null };
}
