import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CmsController } from './cms/cms.controller';
import { CmsDraftService } from './cms/cms-draft.service';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
  controllers: [ContentController, CmsController],
  providers: [ContentService, CmsDraftService],
})
export class ContentModule {}
