import { Type } from 'class-transformer';
import { IsMongoId, ValidateNested } from 'class-validator';
import { UpdateOrderStatusDto } from './update-order-status.dto';

export class UpdateOrderStatusCommandDto {
  @IsMongoId()
  orderId: string;

  @ValidateNested()
  @Type(() => UpdateOrderStatusDto)
  update: UpdateOrderStatusDto;
}
