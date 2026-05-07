import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../shared/database/database.module';
import { AccountsModule } from './modules/accounts/accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['user-service/.env', '.env', 'user-service/.env.example'],
    }),
    DatabaseModule,
    AccountsModule,
  ],
})
export class AppModule {}
