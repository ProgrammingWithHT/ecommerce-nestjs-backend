import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { buildRmqClientRegistration } from '../../../../shared/microservices/rmq.factory';
import { ORDER_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { OrdersGatewayController } from './orders.gateway-controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      buildRmqClientRegistration(
        ORDER_SERVICE_CLIENT,
        'ORDER_SERVICE_QUEUE',
        'order_queue',
      ),
    ]),
  ],
  controllers: [OrdersGatewayController],
  providers: [RpcClientService],
})
export class OrdersGatewayModule {}
