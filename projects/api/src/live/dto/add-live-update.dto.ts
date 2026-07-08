import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** A new live-coverage update posted by staff. */
export class AddLiveUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  isKeyEvent?: boolean;
}
