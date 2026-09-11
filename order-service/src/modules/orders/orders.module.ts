import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '@nestjs/microservices';
import { AuthCacheService } from '../../../../shared/auth/auth-cache.service';
import { JwtTokenModule } from '../../../../shared/auth/jwt-token.module';
import { RemoteAuthService } from '../../../../shared/auth/remote-auth.service';
import { RpcAuthGuard } from '../../../../shared/auth/rpc-auth.guard';
import { buildRmqClientRegistration } from '../../../../shared/microservices/rmq.factory';
import {
  PRODUCT_SERVICE_CLIENT,
  USER_SERVICE_CLIENT,
} from '../../../../shared/microservices/service-tokens';
import { INVENTORY_PORT } from './ports/inventory.port';
import { Order, OrderSchema } from './schemas/order.schema';
import { ProductInventoryClient } from './product-inventory.client';
import { OrdersMessageController } from './orders.message-controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    JwtTokenModule.register(),
    ClientsModule.registerAsync([
      buildRmqClientRegistration(
        USER_SERVICE_CLIENT,
        'USER_SERVICE_QUEUE',
        'user_queue',
      ),
      buildRmqClientRegistration(
        PRODUCT_SERVICE_CLIENT,
        'PRODUCT_SERVICE_QUEUE',
        'product_queue',
      ),
    ]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [OrdersMessageController],
  providers: [
    AuthCacheService,
    RemoteAuthService,
    RpcAuthGuard,
    OrdersRepository,
    OrdersService,
    ProductInventoryClient,
    {
      provide: INVENTORY_PORT,
      useExisting: ProductInventoryClient,
    },
  ],
})
export class OrdersModule {}
