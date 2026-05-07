import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { buildTcpClientRegistration } from '../../../../shared/microservices/tcp.factory';
import { ORDER_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { OrdersGatewayController } from './orders.gateway-controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      buildTcpClientRegistration(
        ORDER_SERVICE_CLIENT,
        'ORDER_SERVICE_HOST',
        'ORDER_SERVICE_PORT',
      ),
    ]),
  ],
  controllers: [OrdersGatewayController],
  providers: [RpcClientService],
})
export class OrdersGatewayModule {}
