import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../../../shared/auth/authenticated-user.interface';
import { CreateOrderDto } from '../../../../shared/contracts/orders/create-order.dto';
import { OrderStatus } from '../../../../shared/contracts/orders/order-status.enum';
import { UpdateOrderStatusDto } from '../../../../shared/contracts/orders/update-order-status.dto';
import { INVENTORY_PORT, InventoryPort } from './ports/inventory.port';
import { OrdersRepository } from './orders.repository';
import { ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    @Inject(INVENTORY_PORT) private readonly inventoryPort: InventoryPort,
    @Inject('PRODUCT_SERVICE_CLIENT') private readonly client: ClientProxy,
  ) { }

  async create(createOrderDto: CreateOrderDto, authUser: AuthenticatedUser) {
    try {

      // await this.inventoryPort.decreaseStock(
      //   createOrderDto.orderItems,
      //   authUser.accessToken, // make sure this exists
      // );

      const createOrder = await this.ordersRepository.create({
        ...createOrderDto,
        user: authUser,
      });

      try{
        this.client.emit(MESSAGE_PATTERNS.orders.created, {
          items: createOrder.orderItems.map((item) => ({
            productId: item.product,
            quantity: item.quantity,
          })),
        });
      }catch(err){
        console.log('error',err)
      }




      return {
        success: true,
        createOrder,
      };
    } catch {
      throw new BadRequestException('Failed to create order');
    }
  }

  async findOne(orderId: string, authUser: AuthenticatedUser) {
    const order = await this.ordersRepository.findOne(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (authUser.role !== 'admin' && order.user.id !== authUser.id) {
      throw new ForbiddenException('You cannot access this order');
    }

    return order;
  }

  async findMyOrders(userId: string) {
    return this.ordersRepository.findMyOrders(userId);
  }

  async findAll() {
    const orders = await this.ordersRepository.findAll();
    const totalAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    return { totalAmount, orders };
  }

  async update(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    accessToken: string | undefined,
  ) {
            console.log('calling 1')

    const order = await this.ordersRepository.update(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderStatus === OrderStatus.Delivered) {
      throw new BadRequestException('Already delivered');
    }
    if (order.orderStatus === OrderStatus.Cancelled) {
      throw new BadRequestException('Order already cancelled');
    }

    try {
      // if (
      //   updateOrderStatusDto.status === OrderStatus.Shipped &&
      //   order.orderStatus !== OrderStatus.Shipped
      // ) {
      //   if (!accessToken) {
      //     throw new BadRequestException('Access token is required');
      //   }

      //   await this.inventoryPort.decreaseStock(order.orderItems, accessToken);
      // }

      order.orderStatus = updateOrderStatusDto.status;

      if (updateOrderStatusDto.status === OrderStatus.Delivered) {
        order.deliveredAt = new Date();
      }



      if (updateOrderStatusDto.status === OrderStatus.Cancelled) {
        console.log('calling 4')
        this.client.emit(MESSAGE_PATTERNS.orders.cancelled, {
          orderId: order._id,
          items: order.orderItems.map((item) => ({
            productId: item.product,
            quantity: item.quantity,
          })),
        });
      }


      return await order.save();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to update order');
    }
  }

  async delete(orderId: string) {
    const order = await this.ordersRepository.delete(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    try {
      return await order.deleteOne();
    } catch {
      throw new BadRequestException('Failed to delete order');
    }
  }
}
