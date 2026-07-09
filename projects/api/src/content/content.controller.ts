import { Controller, Get, HttpStatus, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { apiResponse } from '../common/http/api-response';
import { ContentService } from './content.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';

/** Public, read-only content endpoints. Served under the global `/v1` prefix. */
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

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
  async getArticle(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response) {
    const article = await this.content.getArticleBySlug(slug);
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
