import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from '../../shared/microservices/rpc-exception.filter';
import { buildTcpMicroserviceOptions } from '../../shared/microservices/tcp.factory';

async function bootstrap() {
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const tcpOptions = buildTcpMicroserviceOptions(configService);
  await app.close();

  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    tcpOptions,
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
