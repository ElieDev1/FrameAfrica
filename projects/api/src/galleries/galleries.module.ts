import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GalleriesController } from './galleries.controller';
import { GalleriesService } from './galleries.service';

@Module({
  imports: [AuthModule], // TokenService for the staff management routes
  controllers: [GalleriesController],
  providers: [GalleriesService],
})
export class GalleriesModule {}
