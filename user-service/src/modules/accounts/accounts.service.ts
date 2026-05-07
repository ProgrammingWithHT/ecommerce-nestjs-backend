import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { UpdateQuery } from 'mongoose';
import { AuthenticatedUser } from '../../../../shared/auth/authenticated-user.interface';
import { JwtTokenService } from '../../../../shared/auth/jwt-token.service';
import { CloudinaryService } from '../../../../shared/cloudinary/cloudinary.service';
import { ForgotPasswordDto } from '../../../../shared/contracts/auth/forgot-password.dto';
import { LoginUserDto } from '../../../../shared/contracts/auth/login-user.dto';
import { RegisterUserDto } from '../../../../shared/contracts/auth/register-user.dto';
import { ResetPasswordDto } from '../../../../shared/contracts/auth/reset-password.dto';
import { SerializedFileDto } from '../../../../shared/contracts/files/serialized-file.dto';
import { UpdatePasswordDto } from '../../../../shared/contracts/auth/update-password.dto';
import { UpdateProfileDto } from '../../../../shared/contracts/auth/update-profile.dto';
import { UpdateUserRoleDto } from '../../../../shared/contracts/auth/update-user-role.dto';
import { ValidateAccessTokenDto } from '../../../../shared/contracts/auth/validate-access-token.dto';
import { ValidateAccessTokenResponse } from '../../../../shared/contracts/auth/validate-access-token.response';
import { AccountsRepository } from './accounts.repository';
import { User, UserDocument } from './schemas/user.schema';

type PublicUser = Omit<
  User,
  'password' | 'resetPasswordToken' | 'resetPasswordExpire' | 'comparePassword' | 'getResetPasswordToken'
> & {
  _id: string;
};

type AuthResponse = {
  success: boolean;
  token: string;
  // accessToken: string;
  user: PublicUser;
};

type StoredAvatar = {
  public_id: string;
  url: string;
};

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly jwtTokenService: JwtTokenService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
    avatarFile?: SerializedFileDto,
  ): Promise<AuthResponse> {


    const password = registerUserDto.password;
    const confirmPassword = registerUserDto.confirmPassword;

    if(password !== confirmPassword) throw new ConflictException("password and confirm password are not same!")

    const email = registerUserDto.email.toLowerCase();
    const existingUser = await this.accountsRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    this.ensureImageFile(avatarFile);

    const uploadedAvatar = avatarFile
      ? await this.uploadAvatar(avatarFile)
      : undefined;

    try {
      const { confirmPassword, ...userData } = registerUserDto;
      const user = await this.accountsRepository.create({
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
    const user = await this.accountsRepository.findByEmailWithPassword(
      loginUserDto.email,
    );

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
    const user = await this.accountsRepository.findByEmail(forgotPasswordDto.email);
    const response: { success: boolean; message: string; resetToken?: string } = {
      success: true,
      message:
        'If that email exists, password reset instructions are ready to send.',
    };

    if (!user) {
      return response;
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    console.log(process.env.NODE_ENV)
    // For (dev/development only )
    if (process.env.NODE_ENV !== 'production') {
      console.log('hi')
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
    const user = await this.accountsRepository.findByResetPasswordToken(resetPasswordToken);

    console.log(user);

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

  async getProfile(accessToken?: string) {
    const payload = await this.jwtTokenService.verifyAccessToken(accessToken);
    const user = await this.findExistingUser(payload.sub);

    return {
      success: true,
      user: this.toPublicUser(user),
    };
  }

  async updatePassword(accessToken: string | undefined, updatePasswordDto: UpdatePasswordDto) {
    const payload = await this.jwtTokenService.verifyAccessToken(accessToken);

    this.ensurePasswordsMatch(
      updatePasswordDto.newPassword,
      updatePasswordDto.confirmPassword,
    );

    const user = await this.accountsRepository.findByIdWithPassword(payload.sub);

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
    accessToken: string | undefined,
    updateProfileDto: UpdateProfileDto,
    avatarFile?: SerializedFileDto,
  ) {
    const payload = await this.jwtTokenService.verifyAccessToken(accessToken);
    const userId = payload.sub;
    const existingUser = await this.findExistingUser(userId);
    const updateData: UpdateQuery<User> = { ...updateProfileDto };

    if (updateProfileDto.email) {
      const email = updateProfileDto.email.toLowerCase();
      const duplicateUser = await this.accountsRepository.findByEmail(email);

      if (duplicateUser && duplicateUser._id.toString() !== userId) {
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
      user = await this.accountsRepository.updateById(userId, updateData);
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
    const users = await this.accountsRepository.findAll();

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

  async updateUserRole(
    userId: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ) {
    const user = await this.accountsRepository.updateRole(
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
    const user = await this.accountsRepository.deleteById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  async validateToken(
    validateAccessTokenDto: ValidateAccessTokenDto,
  ): Promise<ValidateAccessTokenResponse> {
    const user = await this.findAuthorizedUser(validateAccessTokenDto.userId);

    if (
      user.email !== validateAccessTokenDto.email ||
      user.role !== validateAccessTokenDto.role
    ) {
      throw new UnauthorizedException('Token claims are stale');
    }

    return {
      valid: true,
      user: this.toAuthenticatedUser(user),
    };
  }

  private async findAuthorizedUser(userId: string) {
    const user = await this.accountsRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Token user no longer exists');
    }

    return user;
  }

  private async findExistingUser(userId: string) {
    const user = await this.accountsRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private buildAuthResponse(user: UserDocument): AuthResponse {
    const token = this.jwtTokenService.signAccessToken(this.toAuthenticatedUser(user));

    return {
      success: true,
      token,
      // accessToken: token,
      user: this.toPublicUser(user),
    };
  }

  private toAuthenticatedUser(user: UserDocument): AuthenticatedUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
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

  private ensureImageFile(file?: SerializedFileDto) {
    if (!file) {
      return;
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image file');
    }
  }

  private async uploadAvatar(file: SerializedFileDto): Promise<StoredAvatar> {
    try {
      const result = await this.cloudinaryService.uploadImage(file, 'users/avatars');

      return {
        public_id: result.public_id,
        url: result.secure_url,
      };
    } catch {
      throw new BadRequestException('Avatar upload failed');
    }
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
