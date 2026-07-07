import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  /** Reply target. Replies are flattened to a single level (see the service). */
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
