import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TipsController } from './tips.controller';
import { TipsService } from './tips.service';

@Module({
  imports: [AuthModule, NotificationsModule], // TokenService + staff alerts
  controllers: [TipsController],
  providers: [TipsService],
})
export class TipsModule {}
