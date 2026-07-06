import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ArticleLanguage } from '@prisma/client';

/** Query params for `GET /articles` (public, published-only). */
export class ListArticlesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  /** Opaque cursor from a previous page's `meta.pagination.nextCursor`. */
  @IsOptional()
  @IsString()
  cursor?: string;

  /** Filter by category slug. */
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ArticleLanguage)
  language?: ArticleLanguage;

  /** Free-text term matched against title/subtitle/excerpt (simple contains for now). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
