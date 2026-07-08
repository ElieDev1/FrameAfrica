import { IsString, MaxLength, MinLength } from 'class-validator';

/** A TOTP code used to enable or disable two-factor auth. */
export class TwoFactorTokenDto {
  @IsString()
  @MinLength(6)
  @MaxLength(10)
  token!: string;
}
