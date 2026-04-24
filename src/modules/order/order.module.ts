import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { ProductModule } from '../product/product.module';
import { OrderRepository } from './order.repository';

@Module({
  imports: [
    ProductModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository]
})
export class OrderModule {}
