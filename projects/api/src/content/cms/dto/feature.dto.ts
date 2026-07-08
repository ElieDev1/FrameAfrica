import { IsBoolean } from 'class-validator';

/** Toggle whether an article is featured (pinned) on the homepage. */
export class FeatureDto {
  @IsBoolean()
  featured!: boolean;
}
