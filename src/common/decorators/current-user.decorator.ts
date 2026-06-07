import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export type RequestUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
