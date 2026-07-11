import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Create a gallery. `images` is an untyped array of `{ url, alt, caption?,
 * credit? }` — it is fully validated + sanitised in the service (bad URLs are
 * rejected, text is markup-stripped), mirroring the article block sanitizer.
 */
export class CreateGalleryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

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
}
