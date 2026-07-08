import { IsIn } from 'class-validator';

export class ModerateCommentDto {
  @IsIn(['keep', 'hide', 'remove'])
  action!: 'keep' | 'hide' | 'remove';
}
