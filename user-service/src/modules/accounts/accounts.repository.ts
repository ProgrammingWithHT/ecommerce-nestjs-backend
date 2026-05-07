import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { UserRole } from '../../../../shared/auth/user-role.enum';
import { RegisterUserDto } from '../../../../shared/contracts/auth/register-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  create(data: RegisterUserDto) {
    const {confirmPassword, ...userData} = data;

    return this.userModel.create(userData);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  findByEmailWithPassword(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  findAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  findByIdWithPassword(id: string) {
    return this.userModel.findById(id).select('+password');
  }

  findByResetPasswordToken(resetPasswordToken: string, now = new Date()) {
    return this.userModel
      .findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: now },
      })
      .select('+password');
  }

  updateById(id: string, data: UpdateQuery<User>) {
    return this.userModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  updateRole(id: string, role: UserRole) {
    return this.updateById(id, { role });
  }

  deleteById(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
