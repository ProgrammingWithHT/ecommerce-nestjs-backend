import { IsEmail, IsEnum, IsString } from 'class-validator';
import { UserRole } from '../../auth/user-role.enum';

export class ValidateAccessTokenDto {
  @IsString()
  userId: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}
