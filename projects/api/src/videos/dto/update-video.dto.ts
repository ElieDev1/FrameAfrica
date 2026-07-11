import { IsBoolean, IsOptional } from 'class-validator';

/** Curation flags for a cached clip (feature to the top / hide from the hub). */
export class UpdateVideoDto {
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}
