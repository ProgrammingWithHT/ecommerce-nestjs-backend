import { IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from "class-validator";

// 🔹 Review DTO
export class ReviewDto {
  @IsMongoId()
  user: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;
}