import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { buildTcpClientRegistration } from '../../../../shared/microservices/tcp.factory';
import { PRODUCT_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { ProductsGatewayController } from './products.gateway-controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      buildTcpClientRegistration(
        PRODUCT_SERVICE_CLIENT,
        'PRODUCT_SERVICE_HOST',
        'PRODUCT_SERVICE_PORT',
      ),
    ]),
  ],
  controllers: [ProductsGatewayController],
  providers: [RpcClientService],
})
export class ProductsGatewayModule {}
