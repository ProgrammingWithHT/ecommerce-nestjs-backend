import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Roles } from '../../../../shared/auth/roles.decorator';
import { RpcAuthGuard } from '../../../../shared/auth/rpc-auth.guard';
import { RpcRequest } from '../../../../shared/auth/rpc-request.interface';
import { UserRole } from '../../../../shared/auth/user-role.enum';
import { CreateOrderDto } from '../../../../shared/contracts/orders/create-order.dto';
import { OrderIdDto } from '../../../../shared/contracts/orders/order-id.dto';
import { UpdateOrderStatusCommandDto } from '../../../../shared/contracts/orders/update-order-status-command.dto';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersMessageController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern(MESSAGE_PATTERNS.orders.create)
  @UseGuards(RpcAuthGuard)
  create(
    @Payload('data') createOrderDto: CreateOrderDto,
    @Payload() payload: RpcRequest<CreateOrderDto>,
  ) {
    return this.ordersService.create(createOrderDto, payload.authUser!);
  }

  @MessagePattern(MESSAGE_PATTERNS.orders.findMine)
  @UseGuards(RpcAuthGuard)
  findMine(@Payload() payload: RpcRequest<Record<string, never>>) {
    return this.ordersService.findMyOrders(payload.authUser!.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.orders.findAll)
  @UseGuards(RpcAuthGuard)
  @Roles(UserRole.Admin)
  findAll() {
    return this.ordersService.findAll();
  }

  @MessagePattern(MESSAGE_PATTERNS.orders.findOne)
  @UseGuards(RpcAuthGuard)
  findOne(
    @Payload('data') orderIdDto: OrderIdDto,
    @Payload() payload: RpcRequest<OrderIdDto>,
  ) {
    return this.ordersService.findOne(orderIdDto.orderId, payload.authUser!);
  }

  @MessagePattern(MESSAGE_PATTERNS.orders.updateStatus)
  @UseGuards(RpcAuthGuard)
  @Roles(UserRole.Admin)
  updateStatus(
    @Payload('data') data: UpdateOrderStatusCommandDto,
    @Payload() payload: RpcRequest<UpdateOrderStatusCommandDto>,
  ) {
    return this.ordersService.update(
      data.orderId,
      data.update,
      payload.accessToken,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.orders.delete)
  @UseGuards(RpcAuthGuard)
  @Roles(UserRole.Admin)
  delete(@Payload('data') orderIdDto: OrderIdDto) {
    return this.ordersService.delete(orderIdDto.orderId);
  }
}
