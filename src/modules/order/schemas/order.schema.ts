import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({
    required: true,
    type: {
      address: String,
      city: String,
      state: String,
      country: String,
      pinCode: Number,
      phoneNo: Number,
    },
  })
  shippingInfo: {
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: number;
    phoneNo: number;
  };

  @Prop([
    {
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      product: { type: Types.ObjectId, ref: 'Product' },
    },
  ])
  orderItems: any[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    required: true,
    type: {
      id: String,
      status: String,
    },
  })
  paymentInfo: {
    id: string;
    status: string;
  };

  @Prop()
  paidAt: Date;

  @Prop({ default: 0 })
  itemsPrice: number;

  @Prop({ default: 0 })
  taxPrice: number;

  @Prop({ default: 0 })
  shippingPrice: number;

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 'Processing' })
  orderStatus: string;

  @Prop()
  deliveredAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);