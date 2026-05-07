import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from './authenticated-user.interface';

type CacheEntry = {
  user: AuthenticatedUser;
  expiresAt: number;
};

@Injectable()
export class AuthCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  get(key: string) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.user;
  }

  set(key: string, user: AuthenticatedUser, ttlMs: number) {
    this.cache.set(key, {
      user,
      expiresAt: Date.now() + ttlMs,
    });
  }
}
