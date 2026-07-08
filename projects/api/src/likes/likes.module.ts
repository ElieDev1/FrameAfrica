import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LikesController } from './likes.controller';
import { LikesService } from './likes.service';

@Module({
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
  controllers: [LikesController],
  providers: [LikesService],
})
export class LikesModule {}
