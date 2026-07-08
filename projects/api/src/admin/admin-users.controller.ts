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
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';
import { apiResponse } from '../common/http/api-response';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SetRolesDto } from './dto/set-roles.dto';
import { SetStatusDto } from './dto/set-status.dto';

/** Admin-only user management (documents/07 UC-ADMIN). */
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.admin)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

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
  async setRoles(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetRolesDto) {
    return apiResponse(await this.users.setRoles(id, dto.roles));
  }

  @Patch(':id/status')
  async setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetStatusDto) {
    return apiResponse(await this.users.setStatus(id, dto.status));
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return apiResponse(await this.users.resetPassword(id));
  }
}

function isRole(value?: string): value is RoleName {
  return !!value && (Object.values(RoleName) as string[]).includes(value);
}

function isStatus(value?: string): value is UserStatus {
  return !!value && (Object.values(UserStatus) as string[]).includes(value);
}
