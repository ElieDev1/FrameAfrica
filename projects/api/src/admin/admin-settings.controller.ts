import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { AdminSettingsService } from './admin-settings.service';
import { SetSettingDto } from './dto/set-setting.dto';

/** Admin-only integration/API-key settings. Raw secrets are never returned. */
@Controller('admin/settings/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  async list() {
    return apiResponse(await this.settings.listIntegrations());
  }

  @Put(':key')
  async set(@Param('key') key: string, @Body() dto: SetSettingDto) {
    return apiResponse(await this.settings.setIntegration(key, dto.value));
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    return apiResponse(await this.settings.removeIntegration(key));
  }
}
