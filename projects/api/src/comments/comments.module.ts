import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommentActionsController } from './comment-actions.controller';
import { CommentModerationController } from './comment-moderation.controller';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [AuthModule, NotificationsModule], // TokenService + moderator alerts
  controllers: [CommentsController, CommentActionsController, CommentModerationController],
  providers: [CommentsService],
})
export class CommentsModule {}
