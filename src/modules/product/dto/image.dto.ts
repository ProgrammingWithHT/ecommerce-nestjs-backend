import { IsNotEmpty, IsString } from "class-validator";

// Image DTO
export class ImageDto {
  @IsString()
  @IsNotEmpty()
  public_id: string;

  @IsString()
  @IsNotEmpty()
  url: string;
}
