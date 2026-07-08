import { IsString, MaxLength, MinLength } from 'class-validator';

/** The note appended to a published article as a correction/retraction. */
export class AddCorrectionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  note!: string;
}
