import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;

  /** TOTP code — required only when the account has 2FA enabled. */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  token?: string;
}
