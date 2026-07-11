import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MediaStatus, PodcastMediaKind } from '@prisma/client';

export class CreateEpisodeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  mediaUrl!: string;

  @IsOptional()
  @IsEnum(PodcastMediaKind)
  mediaKind?: PodcastMediaKind;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  durationSec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  episodeNo?: number;
}

export class UpdateEpisodeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  mediaUrl?: string;

  @IsOptional()
  @IsEnum(PodcastMediaKind)
  mediaKind?: PodcastMediaKind;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  durationSec?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  episodeNo?: number;

  @IsOptional()
  @IsEnum(MediaStatus)
  status?: MediaStatus;
}
