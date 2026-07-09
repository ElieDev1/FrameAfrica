import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTipDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contact?: string;
}
