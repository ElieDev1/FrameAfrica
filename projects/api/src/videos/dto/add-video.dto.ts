import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Curate a single clip into the hub by pasting a YouTube URL (or bare id). */
export class AddVideoDto {
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}
