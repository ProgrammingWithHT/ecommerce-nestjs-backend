import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ClientsProviderAsyncOptions,
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';

const parsePort = (value: string | number | undefined, fallback: number) => {
  const parsed = Number(value ?? fallback);

  return Number.isNaN(parsed) ? fallback : parsed;
};

export const buildTcpClientRegistration = (
  name: string,
  hostEnvKey: string,
  portEnvKey: string,
): ClientsProviderAsyncOptions => ({
  name,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    transport: Transport.TCP,
    options: {
      host: configService.get<string>(hostEnvKey, '127.0.0.1'),
      port: parsePort(configService.get<string>(portEnvKey), 4000),
    },
  }),
});

export const buildTcpMicroserviceOptions = (
  configService: ConfigService,
): MicroserviceOptions => ({
  transport: Transport.TCP,
  options: {
    host: configService.get<string>('TCP_HOST', '0.0.0.0'),
    port: parsePort(configService.get<string>('TCP_PORT'), 4000),
  },
});
