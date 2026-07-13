import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { StorageService } from '../common/storage/storage.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  // AuthModule → TokenService (JwtAuthGuard). AdminModule → AdminSettingsService,
  // which tells StorageService whether an S3 bucket is configured.
  imports: [AuthModule, AdminModule],
  controllers: [MediaController],
  providers: [MediaService, StorageService],
})
export class MediaModule {}
