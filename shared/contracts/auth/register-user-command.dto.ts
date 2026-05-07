import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { SerializedFileDto } from '../files/serialized-file.dto';
import { RegisterUserDto } from './register-user.dto';

export class RegisterUserCommandDto {
  @ValidateNested()
  @Type(() => RegisterUserDto)
  registerUser: RegisterUserDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SerializedFileDto)
  avatar?: SerializedFileDto;
}
