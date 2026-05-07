import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';

@Module({})
export class JwtTokenModule {
  static register(): DynamicModule {
    return {
      module: JwtTokenModule,
      imports: [
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.getOrThrow<string>('JWT_SECRET'),
            signOptions: {
              expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as never,
            },
          }),
        }),
      ],
      providers: [JwtTokenService],
      exports: [JwtTokenService],
    };
  }
}
