import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ArticleLanguage } from '@prisma/client';

export type ArticleSort = 'latest' | 'popular';

/** Query params for `GET /articles` (public, published-only). */
export class ListArticlesQueryDto {
  /** Ordering: `latest` (default, newest first) or `popular` (most viewed). */
  @IsOptional()
  @IsIn(['latest', 'popular'])
  sort?: ArticleSort;

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

  /** Filter by category slug (aggregates the section's sub-sections). */
  @IsOptional()
  @IsString()
  category?: string;

  /** Filter by topic/tag slug. */
  @IsOptional()
  @IsString()
  topic?: string;

  /** Filter by author slug — everything one byline has published. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  author?: string;

  /** Only editor-featured (homepage-pinned) articles, newest pin first. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(ArticleLanguage)
  language?: ArticleLanguage;

  /** Free-text term matched against title/subtitle/excerpt (simple contains for now). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
