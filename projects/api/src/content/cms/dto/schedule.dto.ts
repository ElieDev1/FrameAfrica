import { IsDateString } from 'class-validator';

/** When to publish a reviewed article (ISO 8601, must be in the future). */
export class ScheduleDto {
  @IsDateString()
  scheduledAt!: string;
}
