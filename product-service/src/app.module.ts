import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../shared/database/database.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['product-service/.env', '.env'],
    }),
    DatabaseModule,
    ProductsModule,
  ],
})
export class AppModule {}
