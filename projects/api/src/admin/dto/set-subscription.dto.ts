import { IsISO8601, IsOptional } from 'class-validator';

export class SetSubscriptionDto {
  /** Paid access through this instant. Omit (or null) to revoke. */
  @IsOptional()
  @IsISO8601()
  until?: string | null;
}
