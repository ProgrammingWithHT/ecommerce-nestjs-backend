import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtTokenModule } from '../../../../shared/auth/jwt-token.module';
import { CloudinaryModule } from '../../../../shared/cloudinary/cloudinary.module';
import { AccountsRpcAuthGuard } from './accounts-rpc-auth.guard';
import { AccountsMessageController } from './accounts.message-controller';
import { AccountsRepository } from './accounts.repository';
import { AccountsService } from './accounts.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    CloudinaryModule,
    JwtTokenModule.register(),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AccountsMessageController],
  providers: [AccountsService, AccountsRepository, AccountsRpcAuthGuard],
})
export class AccountsModule {}
