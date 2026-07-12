import { IsBoolean } from 'class-validator';

/** `true` to like, `false` to unlike — idempotent either way. */
export class LikeDto {
  @IsBoolean()
  liked!: boolean;
}
