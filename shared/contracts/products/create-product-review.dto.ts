import { Type } from 'class-transformer';
import { IsMongoId, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateProductReviewDto {
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}
