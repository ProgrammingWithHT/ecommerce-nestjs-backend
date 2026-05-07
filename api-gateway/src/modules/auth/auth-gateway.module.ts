import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { buildTcpClientRegistration } from '../../../../shared/microservices/tcp.factory';
import { USER_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { AuthGatewayController } from './auth.gateway-controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      buildTcpClientRegistration(
        USER_SERVICE_CLIENT,
        'USER_SERVICE_HOST',
        'USER_SERVICE_PORT',
      ),
    ]),
  ],
  controllers: [AuthGatewayController],
  providers: [RpcClientService],
})
export class AuthGatewayModule {}
