import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RpcRequest } from './rpc-request.interface';
import { ROLES_KEY } from './roles.decorator';
import { RemoteAuthService } from './remote-auth.service';
import { UserRole } from './user-role.enum';

@Injectable()
export class RpcAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly remoteAuthService: RemoteAuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const payload = context.switchToRpc().getData<RpcRequest<unknown>>();
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const user = await this.remoteAuthService.authorize(
      payload?.accessToken,
      requiredRoles,
    );

    if (payload && typeof payload === 'object') {
      payload.authUser = user;
    }

    return true;
  }
}
