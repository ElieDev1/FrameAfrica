import { IsEnum } from 'class-validator';
import { InquiryStatus } from '@prisma/client';

export class UpdateInquiryDto {
  @IsEnum(InquiryStatus)
  status!: InquiryStatus;
}
