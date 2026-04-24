import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { UserRole } from '../../../common/enums/user-role.enum';

export type UserDocument = HydratedDocument<User>;

// Avatar Subdocument
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

// Main User Schema
@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
  transform: (_, ret) => {
    const user = ret as any;

    delete user.password;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;

    return user;
  },
},
})
export class User {
  @Prop({
    required: [true, 'Please enter your name'],
    maxlength: [30, 'Name cannot exceed 30 characters'],
    minlength: [4, 'Name should have more than 4 characters'],
    trim: true,
  })
  name: string;

  @Prop({
    required: [true, 'Please enter your email'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    trim: true,
    unique: true,
  })
  email: string;

  @Prop({
    required: [true, 'Please enter your password'],
    minlength: [8, 'Password should be greater than 8 characters'],
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

  // 👇 Methods (Types only here)
  comparePassword: (enteredPassword: string) => Promise<boolean>;
  getResetPasswordToken: () => string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before save
UserSchema.pre<UserDocument>('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
UserSchema.methods.comparePassword = function (
  enteredPassword: string,
) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Reset password token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = randomBytes(20).toString('hex');

  this.resetPasswordToken = createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);

  return resetToken;
};