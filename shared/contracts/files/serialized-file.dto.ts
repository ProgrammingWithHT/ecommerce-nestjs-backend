import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SerializedFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalname: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mimetype: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  size?: number;

  @IsString()
  @IsNotEmpty()
  bufferBase64: string;
}
