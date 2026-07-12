import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

/**
 * Global so any service (e.g. AuthService on a lockout) can inject
 * `NotificationsService` without importing this module — which would create a
 * cycle, since this module imports AuthModule for the JwtAuthGuard.
 */
@Global()
@Module({
  imports: [AuthModule], // provides TokenService for JwtAuthGuard
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // other modules emit notifications
})
export class NotificationsModule {}
