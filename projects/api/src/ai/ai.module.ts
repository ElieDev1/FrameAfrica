import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  // AuthModule → TokenService (JwtAuthGuard). AdminModule → AdminSettingsService,
  // which holds the Anthropic key an admin sets in the dashboard.
  imports: [AuthModule, AdminModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
