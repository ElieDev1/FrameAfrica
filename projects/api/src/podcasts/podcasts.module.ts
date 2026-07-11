import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';

@Module({
  imports: [AuthModule], // TokenService for the staff management routes
  controllers: [PodcastsController],
  providers: [PodcastsService],
})
export class PodcastsModule {}
