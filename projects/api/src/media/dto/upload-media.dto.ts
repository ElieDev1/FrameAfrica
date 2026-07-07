import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Metadata fields that accompany a media upload (multipart form fields). */
export class UploadMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(400)
  alt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  credit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  licence?: string;
}
