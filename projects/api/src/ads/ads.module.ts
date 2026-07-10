import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [AuthModule], // TokenService for the admin management routes
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
