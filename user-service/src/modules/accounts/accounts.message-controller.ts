import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Roles } from '../../../../shared/auth/roles.decorator';
import { RpcRequest } from '../../../../shared/auth/rpc-request.interface';
import { UserRole } from '../../../../shared/auth/user-role.enum';
import { ForgotPasswordDto } from '../../../../shared/contracts/auth/forgot-password.dto';
import { LoginUserDto } from '../../../../shared/contracts/auth/login-user.dto';
import { RegisterUserCommandDto } from '../../../../shared/contracts/auth/register-user-command.dto';
import { ResetPasswordCommandDto } from '../../../../shared/contracts/auth/reset-password-command.dto';
import { UpdatePasswordDto } from '../../../../shared/contracts/auth/update-password.dto';
import { UpdateProfileCommandDto } from '../../../../shared/contracts/auth/update-profile-command.dto';
import { UpdateUserRoleCommandDto } from '../../../../shared/contracts/auth/update-user-role-command.dto';
import { UserIdDto } from '../../../../shared/contracts/auth/user-id.dto';
import { ValidateAccessTokenDto } from '../../../../shared/contracts/auth/validate-access-token.dto';
import { MESSAGE_PATTERNS } from '../../../../shared/microservices/message-patterns';
import { AccountsRpcAuthGuard } from './accounts-rpc-auth.guard';
import { AccountsService } from './accounts.service';

@Controller()
export class AccountsMessageController {
  constructor(private readonly accountsService: AccountsService) {}

  @MessagePattern(MESSAGE_PATTERNS.auth.register)
  register(@Payload('data') data: RegisterUserCommandDto) {
    console.log(data)
    return this.accountsService.register(data.registerUser, data.avatar);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.login)
  login(@Payload('data') loginUserDto: LoginUserDto) {
    return this.accountsService.login(loginUserDto);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.logout)
  logout() {
    return this.accountsService.logout();
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.forgotPassword)
  forgotPassword(@Payload('data') forgotPasswordDto: ForgotPasswordDto) {
    return this.accountsService.forgotPassword(forgotPasswordDto);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.resetPassword)
  resetPassword(@Payload('data') data: ResetPasswordCommandDto) {
    return this.accountsService.resetPassword(data.token, data.resetPassword);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.profile)
  profile(@Payload() payload: RpcRequest<Record<string, never>>) {
    return this.accountsService.getProfile(payload.accessToken);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.updatePassword)
  @UseGuards(AccountsRpcAuthGuard)
  updatePassword(
    @Payload('data') updatePasswordDto: UpdatePasswordDto,
    @Payload() payload: RpcRequest<UpdatePasswordDto>,
  ) {
    return this.accountsService.updatePassword(
      payload.accessToken,
      updatePasswordDto,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.updateProfile)
  @UseGuards(AccountsRpcAuthGuard)
  updateProfile(
    @Payload('data') data: UpdateProfileCommandDto,
    @Payload() payload: RpcRequest<UpdateProfileCommandDto>,
  ) {
    return this.accountsService.updateProfile(
      payload.accessToken,
      data.updateProfile,
      data.avatar,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.findAllUsers)
  @UseGuards(AccountsRpcAuthGuard)
  @Roles(UserRole.Admin)
  findAllUsers() {
    return this.accountsService.getAllUsers();
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.findUserById)
  @UseGuards(AccountsRpcAuthGuard)
  @Roles(UserRole.Admin)
  findUserById(@Payload('data') userIdDto: UserIdDto) {
    return this.accountsService.getSingleUser(userIdDto.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.updateUserRole)
  @UseGuards(AccountsRpcAuthGuard)
  @Roles(UserRole.Admin)
  updateUserRole(@Payload('data') data: UpdateUserRoleCommandDto) {
    return this.accountsService.updateUserRole(data.userId, data.updateUserRole);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.deleteUser)
  @UseGuards(AccountsRpcAuthGuard)
  @Roles(UserRole.Admin)
  deleteUser(@Payload('data') userIdDto: UserIdDto) {
    return this.accountsService.deleteUser(userIdDto.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.auth.validateToken)
  validateToken(@Payload('data') validateAccessTokenDto: ValidateAccessTokenDto) {
    return this.accountsService.validateToken(validateAccessTokenDto);
  }
}
