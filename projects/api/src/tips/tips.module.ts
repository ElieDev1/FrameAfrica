import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TipsController } from './tips.controller';
import { TipsService } from './tips.service';

@Module({
  imports: [AuthModule], // TokenService for the staff-only routes
  controllers: [TipsController],
  providers: [TipsService],
})
export class TipsModule {}
