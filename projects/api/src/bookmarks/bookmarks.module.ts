import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

@Module({
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
  controllers: [BookmarksController],
  providers: [BookmarksService],
})
export class BookmarksModule {}
