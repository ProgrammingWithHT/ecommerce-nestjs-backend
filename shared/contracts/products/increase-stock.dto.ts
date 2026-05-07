import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNumber, Min, ValidateNested } from 'class-validator';

export class StockAdjustmentItemDto {
  @IsMongoId()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class IncreaseStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockAdjustmentItemDto)
  items: StockAdjustmentItemDto[];

  @IsMongoId()
  orderId?: string
}
