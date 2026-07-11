import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InteractivesController } from './interactives.controller';
import { InteractivesService } from './interactives.service';

@Module({
  imports: [AuthModule], // TokenService for the staff management routes
  controllers: [InteractivesController],
  providers: [InteractivesService],
})
export class InteractivesModule {}
