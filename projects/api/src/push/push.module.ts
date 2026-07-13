import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { PushAdminController, PushController } from './push.controller';
import { PushService } from './push.service';

@Module({
  // AuthModule → TokenService (the guard, and best-effort reader identity).
  // AdminModule → AdminSettingsService, which holds the VAPID pair.
  imports: [AuthModule, AdminModule],
  controllers: [PushController, PushAdminController],
  providers: [PushService],
  exports: [PushService], // the newsroom broadcasts on a breaking publish
})
export class PushModule {}
