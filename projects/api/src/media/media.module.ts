import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StorageService } from '../common/storage/storage.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
  controllers: [MediaController],
  providers: [MediaService, StorageService],
})
export class MediaModule {}
