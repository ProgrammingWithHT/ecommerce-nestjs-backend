import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedUser } from '../../../../shared/auth/authenticated-user.interface';
import { CreateOrderDto } from '../../../../shared/contracts/orders/create-order.dto';
import { Order, OrderDocument } from './schemas/order.schema';

type CreateOrderInput = CreateOrderDto & {
  user: AuthenticatedUser;
};

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  create(data: CreateOrderInput) {
    return this.orderModel.create({
      ...data,
      paidAt: new Date(),
    });
  }

  findOne(orderId: string) {
    return this.orderModel.findById(orderId);
  }

  findMyOrders(userId: string) {
    return this.orderModel.find({ 'user.id': userId });
  }

  findAll() {
    return this.orderModel.find();
  }

  update(orderId: string) {
    return this.orderModel.findById(orderId);
  }

  delete(orderId: string) {
    return this.orderModel.findById(orderId);
  }
}
