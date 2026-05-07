import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { SerializedFileDto } from '../files/serialized-file.dto';
import { UpdateProfileDto } from './update-profile.dto';

export class UpdateProfileCommandDto {
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  updateProfile: UpdateProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SerializedFileDto)
  avatar?: SerializedFileDto;
}
