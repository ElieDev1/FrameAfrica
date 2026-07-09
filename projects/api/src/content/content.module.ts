import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
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
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
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
