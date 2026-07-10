import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class UnsubscribeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  token!: string;
}
