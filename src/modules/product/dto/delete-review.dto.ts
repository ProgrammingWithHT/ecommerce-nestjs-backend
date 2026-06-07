import { IsMongoId } from 'class-validator';

export class DeleteReviewDto {
  @IsMongoId()
  productId: string;

  @IsMongoId()
  reviewId: string;
}
