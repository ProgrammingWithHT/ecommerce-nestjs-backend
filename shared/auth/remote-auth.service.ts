import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MESSAGE_PATTERNS } from '../microservices/message-patterns';
import { USER_SERVICE_CLIENT } from '../microservices/service-tokens';
import { ValidateAccessTokenDto } from '../contracts/auth/validate-access-token.dto';
import { ValidateAccessTokenResponse } from '../contracts/auth/validate-access-token.response';
import { AuthenticatedUser } from './authenticated-user.interface';
import { AuthCacheService } from './auth-cache.service';
import { JwtTokenService } from './jwt-token.service';
import { UserRole } from './user-role.enum';

@Injectable()
export class RemoteAuthService {
  constructor(
    @Inject(USER_SERVICE_CLIENT)
    private readonly userServiceClient: ClientProxy,
    private readonly jwtTokenService: JwtTokenService,
    private readonly authCacheService: AuthCacheService,
    private readonly configService: ConfigService,
  ) {}

  async authorize(accessToken: string | undefined, roles: UserRole[] = []) {
    const normalizedToken = this.jwtTokenService.normalizeToken(accessToken);
    const cachedUser = this.authCacheService.get(normalizedToken);

    if (cachedUser) {
      this.ensureRoles(cachedUser, roles);
      return cachedUser;
    }

    const tokenPayload = await this.jwtTokenService.verifyAccessToken(
      normalizedToken,
    );

    const response = await firstValueFrom(
      this.userServiceClient.send<
        ValidateAccessTokenResponse,
        { data: ValidateAccessTokenDto }
      >(MESSAGE_PATTERNS.auth.validateToken, {
        data: {
          userId: tokenPayload.sub,
          email: tokenPayload.email,
          role: tokenPayload.role,
        },
      }),
    );

    if (!response.valid || !response.user) {
      throw new UnauthorizedException('Token subject is no longer authorized');
    }

    this.ensureRoles(response.user, roles);

    const configuredTtl = Number(
      this.configService.get<string>('AUTH_CACHE_TTL_MS', '300000'),
    );
    const tokenTtl = tokenPayload.exp
      ? Math.max(tokenPayload.exp * 1000 - Date.now(), 0)
      : configuredTtl;
    const ttl = Math.min(configuredTtl, tokenTtl || configuredTtl);

    if (ttl > 0) {
      this.authCacheService.set(normalizedToken, response.user, ttl);
    }

    return response.user;
  }

  private ensureRoles(user: AuthenticatedUser, roles: UserRole[]) {
    if (!roles.length) {
      return;
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
