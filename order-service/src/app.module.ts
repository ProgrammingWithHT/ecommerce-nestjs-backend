import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../shared/database/database.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['order-service/.env', '.env'],
    }),
    DatabaseModule,
    OrdersModule,
  ],
})
export class AppModule {}
