import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class TrackViewDto {
  @IsString()
  @MaxLength(512)
  path!: string;

  @IsOptional()
  @IsUUID()
  articleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;
}
