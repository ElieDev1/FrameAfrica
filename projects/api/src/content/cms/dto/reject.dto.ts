import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Optional note explaining why a submitted draft is being returned. */
export class RejectDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
