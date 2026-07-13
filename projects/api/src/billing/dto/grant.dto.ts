import { IsString, IsUUID, MaxLength } from 'class-validator';

export class GrantSubscriptionDto {
  @IsUUID()
  userId!: string;

  @IsString()
  @MaxLength(64)
  planCode!: string;
}
