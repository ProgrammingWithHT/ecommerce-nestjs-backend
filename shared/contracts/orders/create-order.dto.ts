import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ShippingInfoDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @Type(() => Number)
  @IsNumber()
  pinCode: number;

  @Type(() => Number)
  @IsNumber()
  phoneNo: number;
}

export class OrderItemDto {
  @Transform(({ value, obj }) => value ?? obj?.productId)
  @Type(() => String)
  @IsMongoId()
  product: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  image?: string;
}

export class PaymentInfoDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo: ShippingInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @ValidateNested()
  @Type(() => PaymentInfoDto)
  paymentInfo: PaymentInfoDto;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  itemsPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  taxPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  shippingPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalPrice: number;
}
