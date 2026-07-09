import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // other modules emit notifications
})
export class NotificationsModule {}
