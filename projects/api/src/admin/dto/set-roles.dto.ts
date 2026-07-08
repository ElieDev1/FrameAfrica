import { RoleName } from '@prisma/client';
import { ArrayMinSize, IsArray, IsEnum } from 'class-validator';

export class SetRolesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(RoleName, { each: true })
  roles!: RoleName[];
}
