import { Controller, Get, Query } from '@nestjs/common';
import { apiResponse } from '../common/http/api-response';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchService } from './search.service';

/** Public full-text search over published articles. */
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  async run(@Query() query: SearchQueryDto) {
    const { results, hasMore, page } = await this.search.search({
      q: query.q ?? '',
      language: query.language,
      limit: query.limit,
      page: query.page,
    });
    return apiResponse(results, { nextCursor: hasMore ? String(page + 1) : null, hasMore });
  }

  @Get('suggest')
  async suggest(@Query('q') q?: string) {
    return apiResponse(await this.search.suggest(q ?? ''));
  }
}
