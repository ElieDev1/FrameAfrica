import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentModule } from '../content/content.module';
import { FeedController } from './feed.controller';

@Module({
  imports: [
    AuthModule, // provides TokenService for JwtAuthGuard
    ContentModule, // provides ContentService (personalisedFeed)
  ],
  controllers: [FeedController],
})
export class FeedModule {}
