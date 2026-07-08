import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { AdminOverviewService } from './admin-overview.service';

/** Admin monitoring: a system-wide activity snapshot. */
@Controller('admin/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class AdminOverviewController {
  constructor(private readonly overview: AdminOverviewService) {}

  @Get()
  async get() {
    return apiResponse(await this.overview.get());
  }
}
