import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EngagementModule } from '../engagement/engagement.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [AuthModule, EngagementModule], // TokenService + the polymorphic like store
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
