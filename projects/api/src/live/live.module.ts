import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
  controllers: [LiveController],
  providers: [LiveService],
})
export class LiveModule {}
