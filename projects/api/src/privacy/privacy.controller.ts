import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { CurrentUser } from '../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { apiResponse } from '../common/http/api-response';
import { EraseAccountDto } from './dto/erase-account.dto';
import { PrivacyService } from './privacy.service';

/** The signed-in reader's privacy rights: data export + account erasure. */
@Controller('me')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService) {}

  @Get('export')
  async export(@CurrentUser() user: AuthenticatedUser) {
    return apiResponse(await this.privacy.exportData(user.id));
  }

  @Post('delete')
  @HttpCode(200)
  async erase(@CurrentUser() user: AuthenticatedUser, @Body() dto: EraseAccountDto) {
    await this.privacy.eraseAccount(user.id, dto.password);
    return apiResponse({ deleted: true });
  }
}
