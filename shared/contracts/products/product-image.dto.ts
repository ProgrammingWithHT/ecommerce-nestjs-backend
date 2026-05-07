import { IsOptional, IsString, IsUrl } from 'class-validator';

export class ProductImageDto {
  @IsOptional()
  @IsString()
  public_id?: string;

  @IsUrl()
  url: string;
}
