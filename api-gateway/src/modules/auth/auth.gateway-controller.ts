import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ForgotPasswordDto } from '../../../../shared/contracts/auth/forgot-password.dto';
import { LoginUserDto } from '../../../../shared/contracts/auth/login-user.dto';
import { RegisterUserDto } from '../../../../shared/contracts/auth/register-user.dto';
import { ResetPasswordDto } from '../../../../shared/contracts/auth/reset-password.dto';
import { UpdatePasswordDto } from '../../../../shared/contracts/auth/update-password.dto';
import { UpdateProfileDto } from '../../../../shared/contracts/auth/update-profile.dto';
import { UpdateUserRoleDto } from '../../../../shared/contracts/auth/update-user-role.dto';
import { RpcClientService } from '../../../../shared/gateway/rpc-client.service';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';
import { USER_SERVICE_CLIENT } from '../../../../shared/microservices/service-tokens';
import { serializeUploadedFile } from '../../common/file-upload.util';

const avatarUploadOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

@Controller('user')
export class AuthGatewayController {
  constructor(
    @Inject(USER_SERVICE_CLIENT)
    private readonly userServiceClient: ClientProxy,
    private readonly rpcClientService: RpcClientService,
  ) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  register(
    @UploadedFile() avatarFile: { buffer?: Buffer; mimetype?: string; originalname?: string; size?: number } | undefined,
    @Body() registerUserDto: RegisterUserDto,
  ) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.register,
      {
        data: {
          registerUser: registerUserDto,
          avatar: serializeUploadedFile(avatarFile),
        },
      },
    );
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.login,
      { data: loginUserDto },
    );
  }

  @Post('password/forgot')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.forgotPassword,
      { data: forgotPasswordDto },
    );
  }

  @Put('password/reset/:token')
  resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.resetPassword,
      {
        data: {
          token,
          resetPassword: resetPasswordDto,
        },
      },
    );
  }

  @Get('logout')
  logout() {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.logout,
      { data: {} },
    );
  }

  @Get('me')
  me(@Headers('authorization') accessToken?: string) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.profile,
      {
        data: {},
        accessToken,
      },
    );
  }

  @Put('password/update')
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.updatePassword,
      {
        data: updatePasswordDto,
        accessToken,
      },
    );
  }

  @Put('me/update')
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  updateProfile(
    @UploadedFile() avatarFile: { buffer?: Buffer; mimetype?: string; originalname?: string; size?: number } | undefined,
    @Body() updateProfileDto: UpdateProfileDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.updateProfile,
      {
        data: {
          updateProfile: updateProfileDto,
          avatar: serializeUploadedFile(avatarFile),
        },
        accessToken,
      },
    );
  }

  @Get('admin/users')
  findAllUsers(@Headers('authorization') accessToken?: string) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.findAllUsers,
      {
        data: {},
        accessToken,
      },
    );
  }

  @Get('admin/user/:id')
  findUserById(
    @Param('id') userId: string,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.findUserById,
      {
        data: { userId },
        accessToken,
      },
    );
  }

  @Put('admin/user/:id')
  updateUserRole(
    @Param('id') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.updateUserRole,
      {
        data: {
          userId,
          updateUserRole: updateUserRoleDto,
        },
        accessToken,
      },
    );
  }

  @Delete('admin/user/:id')
  deleteUser(
    @Param('id') userId: string,
    @Headers('authorization') accessToken?: string,
  ) {
    return this.rpcClientService.send(
      this.userServiceClient,
      MESSAGE_PATTERNS.auth.deleteUser,
      {
        data: { userId },
        accessToken,
      },
    );
  }
}
