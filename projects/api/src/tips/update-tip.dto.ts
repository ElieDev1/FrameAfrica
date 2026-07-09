import { IsEnum } from 'class-validator';
import { TipStatus } from '@prisma/client';

export class UpdateTipDto {
  @IsEnum(TipStatus)
  status!: TipStatus;
}
