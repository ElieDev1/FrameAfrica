import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EngagementModule } from '../engagement/engagement.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommentActionsController } from './comment-actions.controller';
import { CommentModerationController } from './comment-moderation.controller';
import { CommentsController } from './comments.controller';
import { ContentCommentsController } from './content-comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [AuthModule, NotificationsModule, EngagementModule],
  controllers: [
    CommentsController,
    ContentCommentsController,
    CommentActionsController,
    CommentModerationController,
  ],
  providers: [CommentsService],
})
export class CommentsModule {}
