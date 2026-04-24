import { IsMongoId } from 'class-validator';

export class ProductReviewsQueryDto {
  @IsMongoId()
  productId: string;
}
