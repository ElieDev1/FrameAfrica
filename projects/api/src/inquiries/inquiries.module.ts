import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  imports: [AuthModule, NotificationsModule], // TokenService + staff alerts
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
