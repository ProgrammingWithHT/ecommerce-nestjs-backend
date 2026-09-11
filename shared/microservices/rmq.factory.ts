import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ClientsProviderAsyncOptions,
  MicroserviceOptions,
  RmqOptions,
  Transport,
} from '@nestjs/microservices';

export const buildRmqClientRegistration = (
  name: string,
  queueEnvKey: string,
  defaultQueue: string,
): ClientsProviderAsyncOptions => ({
  name,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): RmqOptions => ({
    transport: Transport.RMQ,
    options: {
      urls: [
        configService.get<string>(
          'RABBITMQ_URL',
          'amqp://guest:guest@localhost:5672',
        ),
      ],
      queue: configService.get<string>(queueEnvKey, defaultQueue),
      queueOptions: {
        durable: false,
      },
    },
  }),
});

export const buildRmqMicroserviceOptions = (
  configService: ConfigService,
  queueEnvKey: string,
  defaultQueue: string,
): MicroserviceOptions => ({
  transport: Transport.RMQ,
  options: {
    urls: [
      configService.get<string>(
        'RABBITMQ_URL',
        'amqp://guest:guest@localhost:5672',
      ),
    ],
    queue: configService.get<string>(queueEnvKey, defaultQueue),
    queueOptions: {
      durable: false,
    },
  },
});
