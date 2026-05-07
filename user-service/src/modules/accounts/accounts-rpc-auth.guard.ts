import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtTokenService } from '../../../../shared/auth/jwt-token.service';
import { RpcRequest } from '../../../../shared/auth/rpc-request.interface';
import { ROLES_KEY } from '../../../../shared/auth/roles.decorator';
import { UserRole } from '../../../../shared/auth/user-role.enum';
import { AccountsRepository } from './accounts.repository';

@Injectable()
export class AccountsRpcAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtTokenService: JwtTokenService,
    private readonly accountsRepository: AccountsRepository,
  ) {}

  async canActivate(context: ExecutionContext) {
    const payload = context.switchToRpc().getData<RpcRequest<unknown>>();
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const tokenPayload = await this.jwtTokenService.verifyAccessToken(
      payload?.accessToken,
    );
    const user = await this.accountsRepository.findById(tokenPayload.sub);

    if (!user) {
      throw new ForbiddenException('Token user no longer exists');
    }

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (payload && typeof payload === 'object') {
      payload.authUser = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }

    return true;
  }
}
