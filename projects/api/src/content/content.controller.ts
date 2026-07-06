import { Controller, Get, Param, Query } from '@nestjs/common';
import { apiResponse } from '../common/http/api-response';
import { ContentService } from './content.service';
import { ListArticlesQueryDto } from './dto/list-articles-query.dto';

/** Public, read-only content endpoints. Served under the global `/v1` prefix. */
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('articles')
  async listArticles(@Query() query: ListArticlesQueryDto) {
    const { items, nextCursor, hasMore } =
      await this.content.listArticles(query);
    return apiResponse(items, { nextCursor, hasMore });
  }

  @Get('articles/:slug')
  async getArticle(@Param('slug') slug: string) {
    return apiResponse(await this.content.getArticleBySlug(slug));
  }

  @Get('categories')
  async getCategories() {
    return apiResponse(await this.content.getCategoryTree());
  }
}
