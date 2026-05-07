import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '@nestjs/microservices';
import { AuthCacheService } from '../../../../shared/auth/auth-cache.service';
import { JwtTokenModule } from '../../../../shared/auth/jwt-token.module';
import { RemoteAuthService } from '../../../../shared/auth/remote-auth.service';
import { RpcAuthGuard } from '../../../../shared/auth/rpc-auth.guard';
import { CloudinaryModule } from '../../../../shared/cloudinary/cloudinary.module';
import { buildTcpClientRegistration } from '../../../../shared/microservices/tcp.factory';
import { USER_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsMessageController } from './products.message-controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [
    CloudinaryModule,
    JwtTokenModule.register(),
    ClientsModule.registerAsync([
      buildTcpClientRegistration(
        USER_SERVICE_CLIENT,
        'USER_SERVICE_HOST',
        'USER_SERVICE_PORT',
      ),
    ]),
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductsMessageController],
  providers: [
    AuthCacheService,
    RemoteAuthService,
    RpcAuthGuard,
    ProductsRepository,
    ProductsService,
  ],
})
export class ProductsModule {}
