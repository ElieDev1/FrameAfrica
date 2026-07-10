import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { AdPlacement } from '@prisma/client';

export class CreateAdDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  linkUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsEnum(AdPlacement)
  placement!: AdPlacement;
}

export class UpdateAdDto {
  @IsBoolean()
  isActive!: boolean;
}
