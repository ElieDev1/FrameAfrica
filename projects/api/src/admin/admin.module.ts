import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { AdminOverviewController } from './admin-overview.controller';
import { AdminOverviewService } from './admin-overview.service';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import { AdminTaxonomyController } from './admin-taxonomy.controller';
import { AdminTaxonomyService } from './admin-taxonomy.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [AuthModule, MailModule], // TokenService (guard) + PasswordService + MailerService
  controllers: [
    AdminUsersController,
    AdminSettingsController,
    AdminOverviewController,
    AdminTaxonomyController,
  ],
  providers: [AdminUsersService, AdminSettingsService, AdminOverviewService, AdminTaxonomyService],
  exports: [AdminSettingsService], // raw values read by integration consumers
})
export class AdminModule {}
