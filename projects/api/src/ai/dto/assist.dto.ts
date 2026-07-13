import { ArticleLanguage } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** The body of a draft is the input to every assist. 200 chars is enough to reason about. */
const MIN_TEXT = 200;
/** Beyond this the request is more likely a paste accident than an article. */
const MAX_TEXT = 200_000;

export class SummarizeDto {
  @IsString()
  @MinLength(MIN_TEXT, { message: 'Write a bit more of the story first.' })
  @MaxLength(MAX_TEXT)
  text!: string;

  /** The edition the suggestion is written for. Defaults to English. */
  @IsOptional()
  @IsEnum(ArticleLanguage)
  language?: ArticleLanguage;
}

export class HeadlinesDto extends SummarizeDto {}

export class TagsDto {
  @IsString()
  @MinLength(MIN_TEXT, { message: 'Write a bit more of the story first.' })
  @MaxLength(MAX_TEXT)
  text!: string;
}

export class TranslateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TEXT)
  text!: string;

  /** The edition to translate into. */
  @IsEnum(ArticleLanguage)
  target!: ArticleLanguage;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;
}
