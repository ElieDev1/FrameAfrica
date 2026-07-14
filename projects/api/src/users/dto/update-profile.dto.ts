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

  /** The byline bio a reader sees on /author/<slug>. Empty string clears it. */
  @IsOptional()
  @IsString()
  @MaxLength(600)
  bio?: string;

  /** "Senior reporter, Business" — shown under the name on the author page. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;
}
