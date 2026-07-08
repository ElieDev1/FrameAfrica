import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetSettingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  value!: string;
}
