import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CmsAdminController } from './cms/cms-admin.controller';
import { CmsController } from './cms/cms.controller';
import { CmsCopydeskController } from './cms/cms-copydesk.controller';
import { CmsDraftService } from './cms/cms-draft.service';
import { CmsEditorController } from './cms/cms-editor.controller';
import { CmsEditorService } from './cms/cms-editor.service';
import { SchedulerService } from './cms/scheduler.service';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  // TokenService for JwtAuthGuard + optional reader auth; NotificationsService
  // for emits; AdminSettingsService for the paywall meter setting.
  imports: [AuthModule, NotificationsModule, AdminModule],
  controllers: [
    ContentController,
    CmsController,
    CmsEditorController,
    CmsAdminController,
    CmsCopydeskController,
  ],
  providers: [ContentService, CmsDraftService, CmsEditorService, SchedulerService],
  exports: [ContentService],
})
export class ContentModule {}
