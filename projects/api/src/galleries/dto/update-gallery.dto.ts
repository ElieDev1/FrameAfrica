import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MediaStatus } from '@prisma/client';

/** Partial update of a gallery, including publish/unpublish via `status`. */
export class UpdateGalleryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  coverAlt?: string;

  @IsOptional()
  @IsArray()
  images?: unknown[];

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;
}
