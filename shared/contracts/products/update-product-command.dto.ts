import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsMongoId,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { SerializedFileDto } from '../files/serialized-file.dto';
import { UpdateProductDto } from './update-product.dto';

export class UpdateProductCommandDto {
  @IsMongoId()
  productId: string;

  @ValidateNested()
  @Type(() => UpdateProductDto)
  update: UpdateProductDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => SerializedFileDto)
  files?: SerializedFileDto[];
}
