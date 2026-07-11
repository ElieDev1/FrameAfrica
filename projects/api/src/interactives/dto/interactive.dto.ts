import { IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MediaStatus } from '@prisma/client';

const RATIOS = ['16/9', '4/3', '1/1', '3/2', '2/1'];

export class CreateInteractiveDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  embedUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  source?: string;

  @IsOptional()
  @IsIn(RATIOS)
  aspectRatio?: string;
}

export class UpdateInteractiveDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  embedUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  source?: string;

  @IsOptional()
  @IsIn(RATIOS)
  aspectRatio?: string;

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;
}
