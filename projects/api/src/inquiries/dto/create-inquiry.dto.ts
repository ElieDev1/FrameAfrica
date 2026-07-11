import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { InquiryType } from '@prisma/client';

/** A public footer-form submission — an advertiser or a general contact. */
export class CreateInquiryDto {
  @IsEnum(InquiryType)
  type!: InquiryType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  subject?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  budget?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  placement?: string;
}
