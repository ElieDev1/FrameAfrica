import { IsString, MaxLength, MinLength } from 'class-validator';

/** A user on a generated password sets their own — no email token required. */
export class FirstPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
