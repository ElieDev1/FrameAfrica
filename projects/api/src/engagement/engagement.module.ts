import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';

@Module({
  imports: [AuthModule], // TokenService for the (optional) auth guards
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService], // comments reuse the target-visibility check
})
export class EngagementModule {}
