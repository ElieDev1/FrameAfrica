import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendCampaignDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20000)
  body!: string;
}
