import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { buildRmqClientRegistration } from '../../../../shared/microservices/rmq.factory';
import { PRODUCT_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { ProductsGatewayController } from './products.gateway-controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      buildRmqClientRegistration(
        PRODUCT_SERVICE_CLIENT,
        'PRODUCT_SERVICE_QUEUE',
        'product_queue',
      ),
    ]),
  ],
  controllers: [ProductsGatewayController],
  providers: [RpcClientService],
})
export class ProductsGatewayModule {}
