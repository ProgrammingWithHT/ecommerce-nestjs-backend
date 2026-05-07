import { Type } from 'class-transformer';
import { IsMongoId, ValidateNested } from 'class-validator';
import { UpdateUserRoleDto } from './update-user-role.dto';

export class UpdateUserRoleCommandDto {
  @IsMongoId()
  userId: string;

  @ValidateNested()
  @Type(() => UpdateUserRoleDto)
  updateUserRole: UpdateUserRoleDto;
}
