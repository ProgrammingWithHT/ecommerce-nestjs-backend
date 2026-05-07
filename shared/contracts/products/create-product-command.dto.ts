import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { SerializedFileDto } from '../files/serialized-file.dto';
import { CreateProductDto } from './create-product.dto';

export class CreateProductCommandDto {
  @ValidateNested()
  @Type(() => CreateProductDto)
  product: CreateProductDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => SerializedFileDto)
  files?: SerializedFileDto[];
}
