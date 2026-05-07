import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from './authenticated-user.interface';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtTokenService {
  constructor(private readonly jwtService: JwtService) {}

  signAccessToken(user: AuthenticatedUser) {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async verifyAccessToken(accessToken?: string) {
    const normalizedToken = this.normalizeToken(accessToken);

    try {
      return await this.jwtService.verifyAsync<JwtPayload>(normalizedToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  normalizeToken(accessToken?: string) {
    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    return accessToken.startsWith('Bearer ')
      ? accessToken.slice('Bearer '.length).trim()
      : accessToken.trim();
  }
}
