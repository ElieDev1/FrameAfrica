import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

/**
 * Global so any service can inject `AuditService` to record privileged actions
 * without importing this module everywhere.
 */
@Global()
@Module({
  imports: [AuthModule], // TokenService for the admin guard
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
