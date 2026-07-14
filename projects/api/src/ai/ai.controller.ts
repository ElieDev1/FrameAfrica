import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { AiService } from './ai.service';
import { HeadlinesDto, SummarizeDto, TagsDto, TranslateDto } from './dto/assist.dto';

/**
 * Newsroom AI assist (documents/04-API-Design.md §9).
 *
 * Staff-only and rate-limited: every call costs money at the provider, so the
 * throttle is deliberately tight — a journalist presses "Suggest" a handful of
 * times per story, not a hundred. Nothing here mutates an article; each route
 * returns a suggestion the human accepts or throws away.
 */
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.journalist, RoleName.sub_editor, RoleName.editor, RoleName.admin)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Is a key configured? The editor hides the assist buttons when it is not. */
  @Get('status')
  async status() {
    return apiResponse(await this.ai.status());
  }

  @Post('summarize')
  @HttpCode(200)
  async summarize(@Body() dto: SummarizeDto) {
    return apiResponse(await this.ai.summarize(dto.text, dto.language));
  }

  @Post('headlines')
  @HttpCode(200)
  async headlines(@Body() dto: HeadlinesDto) {
    return apiResponse(await this.ai.headlines(dto.text, dto.language));
  }

  @Post('tags')
  @HttpCode(200)
  async tags(@Body() dto: TagsDto) {
    return apiResponse(await this.ai.tags(dto.text));
  }

  @Post('translate')
  @HttpCode(200)
  async translate(@Body() dto: TranslateDto) {
    return apiResponse(await this.ai.translate(dto.text, dto.target, dto.title));
  }
}
