import { Controller, Get, Headers, HttpStatus, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TokenService } from '../auth/token.service';
import { apiResponse } from '../common/http/api-response';
import { ContentService, type ReaderContext } from './content.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';

/** Public, read-only content endpoints. Served under the global `/v1` prefix. */
@Controller()
export class ContentController {
  constructor(
    private readonly content: ContentService,
    private readonly tokens: TokenService,
  ) {}

  /**
   * Best-effort reader identity for the paywall: an opaque device key from the
   * BFF, plus the signed-in user when a valid bearer token is present. Never
   * rejects — an unauthenticated read is a perfectly normal read.
   */
  private async readerContext(readerKey?: string, authorization?: string): Promise<ReaderContext> {
    const ctx: ReaderContext = { readerKey: readerKey || undefined };
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (token) {
      try {
        const claims = await this.tokens.verifyAccessToken(token);
        ctx.userId = claims.sub;
      } catch {
        // an expired/invalid token just means "anonymous"
      }
    }
    return ctx;
  }

  @Get('articles')
  async listArticles(@Query() query: ListArticlesQueryDto) {
    const { items, nextCursor, hasMore } = await this.content.listArticles(query);
    return apiResponse(items, { nextCursor, hasMore });
  }

  /**
   * Premium articles the caller can't read yet return 402 with a preview
   * payload (documents/04-API-Design.md §7) instead of the full body.
   */
  @Get('articles/:slug')
  async getArticle(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-reader-key') readerKey?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const ctx = await this.readerContext(readerKey, authorization);
    const article = await this.content.getArticleBySlug(slug, ctx);
    if (article.isLocked) {
      res.status(HttpStatus.PAYMENT_REQUIRED);
    }
    return apiResponse(article);
  }

  @Get('articles/:slug/related')
  async getRelated(@Param('slug') slug: string) {
    return apiResponse(await this.content.getRelated(slug));
  }

  /** Public corrections & clarifications log across all published stories. */
  @Get('corrections')
  async getCorrections() {
    return apiResponse(await this.content.listCorrections());
  }

  @Get('categories')
  async getCategories() {
    return apiResponse(await this.content.getCategoryTree());
  }

  @Get('categories/:slug')
  async getCategory(@Param('slug') slug: string) {
    return apiResponse(await this.content.getCategoryBySlug(slug));
  }

  @Get('topics')
  async getTopics() {
    return apiResponse(await this.content.listTopics());
  }

  @Get('topics/:slug')
  async getTopic(@Param('slug') slug: string) {
    return apiResponse(await this.content.getTopicBySlug(slug));
  }
}
