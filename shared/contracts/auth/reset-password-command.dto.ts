import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { ResetPasswordDto } from './reset-password.dto';

export class ResetPasswordCommandDto {
  @IsString()
  token: string;

  @ValidateNested()
  @Type(() => ResetPasswordDto)
  resetPassword: ResetPasswordDto;
}
