import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserService } from './user.service';

const avatarUploadOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  register(
    @UploadedFile() avatarFile: Express.Multer.File | undefined,
    @Body() registerUserDto: RegisterUserDto,
  ) {
    return this.userService.register(registerUserDto, avatarFile);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.userService.forgotPassword(forgotPasswordDto);
  }

  @Put('password/reset/:token')
  resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.userService.resetPassword(token, resetPasswordDto);
  }

  @Get('logout')
  logout() {
    return this.userService.logout();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getUserDetails(@CurrentUser('id') userId: string) {
    return this.userService.getUserDetails(userId);
  }

  @Put('password/update')
  @UseGuards(JwtAuthGuard)
  updatePassword(
    @CurrentUser('id') userId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(userId, updatePasswordDto);
  }

  @Put('me/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', avatarUploadOptions))
  updateProfile(
    @CurrentUser('id') userId: string,
    @UploadedFile() avatarFile: Express.Multer.File | undefined,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, updateProfileDto, avatarFile);
  }

  @Get('admin/users')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('admin/user/:id')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getSingleUser(@Param('id') userId: string) {
    return this.userService.getSingleUser(userId);
  }

  @Put('admin/user/:id')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateUserRole(
    @Param('id') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(userId, updateUserRoleDto);
  }

  @Delete('admin/user/:id')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  deleteUser(@Param('id') userId: string) {
    return this.userService.deleteUser(userId);
  }
}
