import { IsString, MinLength } from 'class-validator';

export class EraseAccountDto {
  /** The account password, re-entered to confirm this destructive action. */
  @IsString()
  @MinLength(1)
  password!: string;
}
