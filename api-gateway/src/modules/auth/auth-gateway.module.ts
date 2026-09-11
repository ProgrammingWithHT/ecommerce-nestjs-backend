import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { buildRmqClientRegistration } from '../../../../shared/microservices/rmq.factory';
import { USER_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { AuthGatewayController } from './auth.gateway-controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      buildRmqClientRegistration(
        USER_SERVICE_CLIENT,
        'USER_SERVICE_QUEUE',
        'user_queue',
      ),
    ]),
  ],
  controllers: [AuthGatewayController],
  providers: [RpcClientService],
})
export class AuthGatewayModule {}
