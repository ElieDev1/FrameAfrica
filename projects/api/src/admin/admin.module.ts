import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [AuthModule, MailModule], // TokenService (guard) + PasswordService + MailerService
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminModule {}
