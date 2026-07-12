import { IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Create an event album (photographers own this; any staffer may file into it). */
export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  /** When the event happened — may differ from the upload date. */
  @IsOptional()
  @IsISO8601()
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}

export class UpdateAlbumDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsISO8601()
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}

/** Move a file into an album, or pass null to unfile it. */
export class SetAssetAlbumDto {
  @IsOptional()
  @IsUUID()
  albumId?: string | null;
}
