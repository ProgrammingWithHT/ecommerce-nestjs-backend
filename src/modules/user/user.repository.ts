import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { UserRole } from '../../common/enums/user-role.enum';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  create(data: RegisterUserDto) {
    return this.userModel.create(data);
  }

  findAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  findWithPassword(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+password');
  }

  findById(id: string) {
    return this.userModel.findById(id);
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
