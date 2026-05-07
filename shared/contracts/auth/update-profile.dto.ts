import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AvatarDto } from './avatar.dto';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvatarDto)
  avatar?: AvatarDto;
}
