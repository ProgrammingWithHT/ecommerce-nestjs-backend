import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ImageDto } from './image.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  ratings?: number;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  category: string;

  @Transform(({ value, obj }) => value ?? obj?.Stock)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  numOfReviews?: number;

  // @IsOptional()
  // @IsArray()
  // @ValidateNested({each: true})
  // @Type(() => ImageDto)
  // images: ImageDto[]
}
