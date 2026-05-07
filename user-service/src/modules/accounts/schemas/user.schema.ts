import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { UserRole } from '../../../../../shared/auth/user-role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class Avatar {
  @Prop({ default: 'default_avatar' })
  public_id: string;

  @Prop({
    default:
      'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  })
  url: string;
}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: (_, ret) => {
      const user = ret as Record<string, unknown>;

      delete user.password;
      delete user.resetPasswordToken;
      delete user.resetPasswordExpire;

      return user;
    },
  },
})
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 4,
    maxlength: 30,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    minlength: 8,
    select: false,
  })
  password: string;

  @Prop({ type: AvatarSchema, default: {} })
  avatar: Avatar;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.User,
  })
  role: UserRole;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpire?: Date;

  comparePassword: (plainTextPassword: string) => Promise<boolean>;
  getResetPasswordToken: () => string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = function comparePassword(
  plainTextPassword: string,
) {
  return bcrypt.compare(plainTextPassword, this.password);
};

UserSchema.methods.getResetPasswordToken = function getResetPasswordToken() {
  const resetToken = randomBytes(20).toString('hex');

  this.resetPasswordToken = createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

  return resetToken;
};
