import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MediaStatus } from '@prisma/client';

export class CreateShowDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

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
  @MaxLength(500)
  spotifyUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  appleUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rssUrl?: string;
}

export class UpdateShowDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title?: string;

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
  @MaxLength(500)
  spotifyUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  appleUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rssUrl?: string;

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;
}
