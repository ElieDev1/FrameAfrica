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
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountService, PasswordService, TokenService, OneTimeTokenService],
  exports: [TokenService],
})
export class AuthModule {}
