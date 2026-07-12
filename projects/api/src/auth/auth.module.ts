import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { AccountService } from './account.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OneTimeTokenService } from './one-time-token.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // No fallback: a missing secret must fail startup (see TokenService).
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: Number(config.get<string>('JWT_ACCESS_TTL', '900')),
        },
      }),
    }),
    MailModule,
    // AuditModule (@Global) and NotificationsModule (@Global) provide their
    // services app-wide — importing them here would create a module cycle
    // (both import AuthModule for their guards).
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountService,
    PasswordService,
    TokenService,
    OneTimeTokenService,
    TwoFactorService,
  ],
  exports: [TokenService, PasswordService, AccountService],
})
export class AuthModule {}
