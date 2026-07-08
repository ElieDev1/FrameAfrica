import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
