import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../../../../shared/auth/user-role.enum';
import { OrderStatus } from '../../../../../shared/contracts/orders/order-status.enum';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class ShippingInfo {
  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  pinCode: number;

  @Prop({ required: true })
  phoneNo: number;
}

export const ShippingInfoSchema = SchemaFactory.createForClass(ShippingInfo);

@Schema({ _id: false })
export class OrderItem {
  @Prop({ required: true })
  product: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  image?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class PaymentInfo {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  status: string;
}

export const PaymentInfoSchema = SchemaFactory.createForClass(PaymentInfo);

@Schema({ _id: false })
export class UserSnapshot {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true, enum: Object.values(UserRole) })
  role: UserRole;
}

export const UserSnapshotSchema = SchemaFactory.createForClass(UserSnapshot);

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Order {
  @Prop({ type: ShippingInfoSchema, required: true })
  shippingInfo: ShippingInfo;

  @Prop({ type: [OrderItemSchema], required: true })
  orderItems: OrderItem[];

  @Prop({ type: UserSnapshotSchema, required: true })
  user: UserSnapshot;

  @Prop({ type: PaymentInfoSchema, required: true })
  paymentInfo: PaymentInfo;

  @Prop()
  paidAt: Date;

  @Prop({ required: true, min: 0 })
  itemsPrice: number;

  @Prop({ required: true, min: 0 })
  taxPrice: number;

  @Prop({ required: true, min: 0 })
  shippingPrice: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.Pending,
  })
  orderStatus: OrderStatus;

  @Prop()
  deliveredAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
