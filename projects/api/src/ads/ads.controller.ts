import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdPlacement, RoleName } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { AdsService } from './ads.service';
import { CreateAdDto, UpdateAdDto } from './dto/create-ad.dto';

/** Public ad serving + admin house-ad management. */
@Controller()
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  /** Serve an active house ad for a placement (or null). */
  @Get('ads')
  async serve(@Query('placement') placement?: string) {
    if (!isPlacement(placement)) return apiResponse(null);
    return apiResponse(await this.ads.serve(placement));
  }

  /** Click-through: count the click and redirect to the advertiser. */
  @Get('ads/:id/go')
  async go(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const url = await this.ads.click(id);
    res.redirect(302, url);
  }

  @Get('admin/ads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.admin)
  async list() {
    return apiResponse(await this.ads.list());
  }

  @Post('admin/ads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.admin)
  async create(@Body() dto: CreateAdDto) {
    return apiResponse(await this.ads.create(dto));
  }

  @Patch('admin/ads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.admin)
  async setActive(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAdDto) {
    await this.ads.setActive(id, dto.isActive);
    return apiResponse({ ok: true });
  }

  @Delete('admin/ads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.admin)
  @HttpCode(200)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.ads.remove(id);
    return apiResponse({ ok: true });
  }
}

function isPlacement(value?: string): value is AdPlacement {
  return !!value && (Object.values(AdPlacement) as string[]).includes(value);
}
