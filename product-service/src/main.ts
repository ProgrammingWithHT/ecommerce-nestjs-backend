import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from '../../shared/microservices/rpc-exception.filter';
import { buildRmqMicroserviceOptions } from '../../shared/microservices/rmq.factory';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const rmqOptions = buildRmqMicroserviceOptions(
    configService,
    'PRODUCT_SERVICE_QUEUE',
    'product_queue',
  );
  await app.close();

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    rmqOptions,
  );

  microservice.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  microservice.useGlobalFilters(new RpcExceptionFilter());

  await microservice.listen();
}

bootstrap();
