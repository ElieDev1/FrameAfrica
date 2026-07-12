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
import { RoleName, UserStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SetRolesDto } from './dto/set-roles.dto';
import { SetStatusDto } from './dto/set-status.dto';
import { SetSubscriptionDto } from './dto/set-subscription.dto';

/** Admin-only user management (documents/07 UC-ADMIN). */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class AdminUsersController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return apiResponse(
      await this.users.list({
        q: q?.trim() || undefined,
        role: isRole(role) ? role : undefined,
        status: isStatus(status) ? status : undefined,
      }),
    );
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return apiResponse(await this.users.create(dto));
  }

  @Patch(':id/roles')
  async setRoles(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRolesDto,
  ) {
    const result = await this.users.setRoles(id, dto.roles);
    await this.audit.record({
      actorId: actor.id,
      action: 'user.roles_changed',
      targetType: 'user',
      targetId: id,
      meta: { roles: dto.roles },
    });
    return apiResponse(result);
  }

  @Patch(':id/status')
  async setStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetStatusDto,
  ) {
    const result = await this.users.setStatus(id, dto.status);
    await this.audit.record({
      actorId: actor.id,
      action: 'user.status_changed',
      targetType: 'user',
      targetId: id,
      meta: { status: dto.status },
    });
    return apiResponse(result);
  }

  /** Comp or revoke a subscription until self-serve payments land. */
  @Patch(':id/subscription')
  async setSubscription(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetSubscriptionDto,
  ) {
    const until = dto.until ? new Date(dto.until) : null;
    const result = await this.users.setSubscription(id, until);
    await this.audit.record({
      actorId: actor.id,
      action: 'user.subscription_changed',
      targetType: 'user',
      targetId: id,
      meta: { until: dto.until ?? null },
    });
    return apiResponse(result);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.users.resetPassword(id);
    await this.audit.record({
      actorId: actor.id,
      action: 'user.password_reset',
      targetType: 'user',
      targetId: id,
    });
    return apiResponse(result);
  }

  /** Clear a brute-force lockout so the user can sign in again. */
  @Post(':id/unlock')
  async unlock(@CurrentUser() actor: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.users.unlock(id);
    await this.audit.record({
      actorId: actor.id,
      action: 'user.unlocked',
      targetType: 'user',
      targetId: id,
    });
    return apiResponse(result);
  }
}

function isRole(value?: string): value is RoleName {
  return !!value && (Object.values(RoleName) as string[]).includes(value);
}

function isStatus(value?: string): value is UserStatus {
  return !!value && (Object.values(UserStatus) as string[]).includes(value);
}
