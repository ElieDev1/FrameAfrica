import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ArticleLanguage } from '@prisma/client';

export class CreateDraftDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  body?: string;

  /**
   * The structured article document (block.types.ts). Shape is validated and
   * sanitised in the service via `sanitizeBlocks`; here we only assert it's an
   * array so obviously-wrong payloads are rejected early.
   */
  @IsOptional()
  @IsArray()
  blocks?: unknown[];

  @IsOptional()
  @IsEnum(ArticleLanguage)
  language?: ArticleLanguage;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  featuredImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  featuredImageAlt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  featuredImageCredit?: string;
}
