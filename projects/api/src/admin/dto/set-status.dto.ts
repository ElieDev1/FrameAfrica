import { UserStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
