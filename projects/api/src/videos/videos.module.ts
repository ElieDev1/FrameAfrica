import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { VideoSyncService } from './video-sync.service';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';

@Module({
  imports: [
    AuthModule, // TokenService for the admin sync route
    AdminModule, // AdminSettingsService (YouTube key + channel id)
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoSyncService],
})
export class VideosModule {}
