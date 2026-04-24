import { IsNotEmpty, IsNumber, IsArray } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  shippingInfo: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: number;
    phoneNo: number;
  };

  @IsArray()
  orderItems: any[];

  @IsNotEmpty()
  paymentInfo: {
    id: string;
    status: string;
  };

  @IsNumber()
  itemsPrice: number;

  @IsNumber()
  taxPrice: number;

  @IsNumber()
  shippingPrice: number;

  @IsNumber()
  totalPrice: number;
}