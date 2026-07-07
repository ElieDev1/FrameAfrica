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

export class UpdateDraftDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

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

  /** The structured article document; validated/sanitised in the service. */
  @IsOptional()
  @IsArray()
  blocks?: unknown[];

  /** Topic slugs to tag this article with; replaces the existing set. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

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

  /** Optional note stored on the revision this update creates. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  changeNote?: string;
}
