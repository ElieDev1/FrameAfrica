import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { RoleName, TipStatus } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { CreateTipDto } from './dto/create-tip.dto';
import { TipsService } from './tips.service';
import { UpdateTipDto } from './update-tip.dto';

@Controller('tips')
export class TipsController {
  constructor(private readonly tips: TipsService) {}

  /** Public, confidential tip submission — tightly rate-limited to deter spam. */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async submit(@Body() dto: CreateTipDto) {
    return apiResponse(await this.tips.submit(dto.message, dto.contact));
  }

  /** Editor/admin tip inbox. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin, RoleName.moderator)
  async list(@Query('status') status?: string) {
    const filter = isTipStatus(status) ? status : undefined;
    return apiResponse(await this.tips.list(filter));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.editor, RoleName.admin, RoleName.moderator)
  async setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTipDto) {
    return apiResponse(await this.tips.setStatus(id, dto.status));
  }
}

function isTipStatus(value?: string): value is TipStatus {
  return !!value && (Object.values(TipStatus) as string[]).includes(value);
}
