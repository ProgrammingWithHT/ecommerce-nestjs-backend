import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { Express } from 'express';
import { UpdateQuery } from 'mongoose';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User, UserDocument } from './schemas/user.schema';
import { UserRepository } from './user.repository';

type PublicUser = Omit<
  User,
  'password' | 'resetPasswordToken' | 'resetPasswordExpire'
> & {
  _id: string;
};

type AuthResponse = {
  success: boolean;
  token: string;
  user: PublicUser;
};

type StoredAvatar = {
  public_id: string;
  url: string;
};

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
    avatarFile?: Express.Multer.File,
  ): Promise<AuthResponse> {
    const email = registerUserDto.email.toLowerCase();
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    this.ensureImageFile(avatarFile);

    const uploadedAvatar = avatarFile
      ? await this.uploadAvatar(avatarFile)
      : undefined;

    try {
      const user = await this.userRepository.create({
        ...registerUserDto,
        email,
        ...(uploadedAvatar ? { avatar: uploadedAvatar } : {}),
      });

      return this.buildAuthResponse(user);
    } catch (error) {
      await this.deleteAvatarIfNeeded(uploadedAvatar?.public_id);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<AuthResponse> {
    const user = await this.userRepository.findWithPassword(loginUserDto.email);

    if (!user || !(await user.comparePassword(loginUserDto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  logout() {
    return {
      success: true,
      message: 'Logged out successfully. Remove the token on the client.',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(forgotPasswordDto.email);
    const response: { success: boolean; message: string; resetToken?: string } =
      {
        success: true,
        message:
          'If that email exists, password reset instructions are ready to send.',
      };

    if (!user) {
      return response;
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
    }

    return response;
  }

  async resetPassword(token: string, resetPasswordDto: ResetPasswordDto) {
    this.ensurePasswordsMatch(
      resetPasswordDto.password,
      resetPasswordDto.confirmPassword,
    );

    const resetPasswordToken = createHash('sha256').update(token).digest('hex');
    const user =
      await this.userRepository.findByResetPasswordToken(resetPasswordToken);

    if (!user) {
      throw new BadRequestException(
        'Password reset token is invalid or expired',
      );
    }

    user.password = resetPasswordDto.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return this.buildAuthResponse(user);
  }

  async getUserDetails(userId: string) {
    const user = await this.findExistingUser(userId);

    return {
      success: true,
      user: this.toPublicUser(user),
    };
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    this.ensurePasswordsMatch(
      updatePasswordDto.newPassword,
      updatePasswordDto.confirmPassword,
    );

    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatches = await user.comparePassword(
      updatePasswordDto.oldPassword,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    user.password = updatePasswordDto.newPassword;
    await user.save();

    return this.buildAuthResponse(user);
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ) {
    const existingUser = await this.findExistingUser(userId);
    const updateData: UpdateQuery<User> = { ...updateProfileDto };

    if (updateProfileDto.email) {
      const email = updateProfileDto.email.toLowerCase();
      const existingUser = await this.userRepository.findByEmail(email);

      if (existingUser && existingUser._id.toString() !== userId) {
        throw new ConflictException('Email is already registered');
      }

      updateData.email = email;
    }

    this.ensureImageFile(avatarFile);

    const uploadedAvatar = avatarFile
      ? await this.uploadAvatar(avatarFile)
      : undefined;

    if (uploadedAvatar) {
      updateData.avatar = uploadedAvatar;
    }

    let user: UserDocument | null;

    try {
      user = await this.userRepository.updateById(userId, updateData);
    } catch (error) {
      await this.deleteAvatarIfNeeded(uploadedAvatar?.public_id);

      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }

    if (!user) {
      await this.deleteAvatarIfNeeded(uploadedAvatar?.public_id);
      throw new NotFoundException('User not found');
    }

    if (uploadedAvatar) {
      await this.deleteAvatarIfNeeded(existingUser.avatar?.public_id);
    }

    return {
      success: true,
      user: this.toPublicUser(user),
    };
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();

    return {
      success: true,
      count: users.length,
      users: users.map((user) => this.toPublicUser(user)),
    };
  }

  async getSingleUser(userId: string) {
    const user = await this.findExistingUser(userId);

    return {
      success: true,
      user: this.toPublicUser(user),
    };
  }

  async updateUserRole(userId: string, updateUserRoleDto: UpdateUserRoleDto) {
    const user = await this.userRepository.updateRole(
      userId,
      updateUserRoleDto.role,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user: this.toPublicUser(user),
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.deleteById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  private async findExistingUser(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private buildAuthResponse(user: UserDocument): AuthResponse {
    return {
      success: true,
      token: this.signToken(user),
      user: this.toPublicUser(user),
    };
  }

  private signToken(user: UserDocument) {
    return this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  }

  private toPublicUser(user: UserDocument): PublicUser {
    const userObject = user.toObject() as Partial<User> & { _id: unknown };

    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpire;

    return {
      ...userObject,
      _id: user._id.toString(),
    } as PublicUser;
  }

  private ensurePasswordsMatch(password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Password confirmation does not match');
    }
  }

  private ensureImageFile(file?: Express.Multer.File) {
    if (!file) {
      return;
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image file');
    }
  }

  private async uploadAvatar(file: Express.Multer.File): Promise<StoredAvatar> {
    const result = await this.cloudinaryService.uploadImage(file, 'users/avatars');

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  private async deleteAvatarIfNeeded(publicId?: string) {
    if (!publicId || publicId === 'default_avatar') {
      return;
    }

    try {
      await this.cloudinaryService.deleteImage(publicId);
    } catch {
      // Avatar cleanup is best-effort after create/update completes.
    }
  }

  private isDuplicateKeyError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
