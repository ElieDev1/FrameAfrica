import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { AuditService } from './audit.service';

/** Admin view of the privileged-action audit trail. */
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  async list() {
    return apiResponse(await this.audit.list());
  }
}
