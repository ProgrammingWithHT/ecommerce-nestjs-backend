import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGatewayModule } from './modules/auth/auth-gateway.module';
import { OrdersGatewayModule } from './modules/orders/orders-gateway.module';
import { ProductsGatewayModule } from './modules/products/products-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['api-gateway/.env', '.env'],
    }),
    AuthGatewayModule,
    ProductsGatewayModule,
    OrdersGatewayModule,
  ],
})
export class AppModule {}
