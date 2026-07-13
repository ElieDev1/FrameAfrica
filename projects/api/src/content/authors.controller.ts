import { Controller, Get, Param } from '@nestjs/common';
import { apiResponse } from '../common/http/api-response';
import { AuthorsService } from './authors.service';

/**
 * Public author pages. A reader who wants to know who wrote a story — and what
 * else they have written — follows the byline here.
 *
 * The author's stories are not duplicated in this response: they come from
 * `GET /articles?author=<slug>`, which already paginates.
 */
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authors: AuthorsService) {}

  @Get()
  async list() {
    return apiResponse(await this.authors.list());
  }

  @Get(':slug')
  async bySlug(@Param('slug') slug: string) {
    return apiResponse(await this.authors.bySlug(slug));
  }
}
