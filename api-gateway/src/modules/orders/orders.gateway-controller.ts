import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from '../../../../shared/contracts/orders/create-order.dto';
import { UpdateOrderStatusDto } from '../../../../shared/contracts/orders/update-order-status.dto';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';
import { ORDER_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';

@Controller('orders')
export class OrdersGatewayController {
  constructor(
    @Inject(ORDER_SERVICE_CLIENT)
    private readonly orderServiceClient: ClientProxy,
    private readonly rpcClientService: RpcClientService,
  ) {}

  @Post('new')
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.orderServiceClient,
      MESSAGE_PATTERNS.orders.create,
      {
        data: createOrderDto,
        accessToken,
      },
    );
  }

  @Get('me')
  findMine(@Headers('authorization') accessToken?: string) {
    return this.rpcClientService.send(
      this.orderServiceClient,
      MESSAGE_PATTERNS.orders.findMine,
      {
        data: {},
        accessToken,
      },
    );
  }

  @Get('admin')
  findAll(@Headers('authorization') accessToken?: string) {
    return this.rpcClientService.send(
      this.orderServiceClient,
      MESSAGE_PATTERNS.orders.findAll,
      {
        data: {},
        accessToken,
      },
    );
  }

  @Get(':id')
  findOne(
    @Param('id') orderId: string,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.orderServiceClient,
      MESSAGE_PATTERNS.orders.findOne,
      {
        data: { orderId },
        accessToken,
      },
    );
  }

  @Put('admin/:id')
  updateStatus(
    @Param('id') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.orderServiceClient,
      MESSAGE_PATTERNS.orders.updateStatus,
      {
        data: {
          orderId,
          update: updateOrderStatusDto,
        },
        accessToken,
      },
    );
  }

  @Delete('admin/:id')
  delete(
    @Param('id') orderId: string,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.orderServiceClient,
      MESSAGE_PATTERNS.orders.delete,
      {
        data: { orderId },
        accessToken,
      },
    );
  }
}
