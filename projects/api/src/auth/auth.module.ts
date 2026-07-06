import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
        signOptions: {
          expiresIn: Number(config.get<string>('JWT_ACCESS_TTL', '900')),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService],
  exports: [TokenService],
})
export class AuthModule {}
