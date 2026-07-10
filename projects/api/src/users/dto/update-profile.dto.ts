import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Fields a reader may change on their own profile. Both are optional so the
 * client can send a partial update; `avatarUrl` accepts an empty string to
 * clear the current photo (validated further in the service).
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
