import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = Number(this.configService.get<number>('REDIS_PORT')) || 6379;

    this.logger.log(`Initializing Redis client connecting to ${host}:${port}`);

    this.client = new Redis({
      host,
      port,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    // Initiate connection asynchronously
    this.client.connect().catch((err) => {
      this.logger.error(`Failed to connect to Redis: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis connection');
    try {
      await this.client.quit();
    } catch (err) {
      this.logger.error(`Error closing Redis connection: ${err}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (data) {
        this.logger.log(`Redis HIT [${key}]`);
        return JSON.parse(data) as T;
      }
      this.logger.log(`Redis MISS [${key}]`);
      return null;
    } catch (error: any) {
      this.logger.error(`Redis GET error for key ${key}: ${error?.message || error}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
      this.logger.log(`Redis SET [${key}] (TTL: ${ttlSeconds ?? 'none'}s)`);
    } catch (error: any) {
      this.logger.error(`Redis SET error for key ${key}: ${error?.message || error}`);
    }
  }

  async delete(keys: string | string[]): Promise<void> {
    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      if (keyArray.length === 0) {
        return;
      }
      await this.client.del(...keyArray);
      this.logger.log(`Redis INVALIDATE [${keyArray.join(', ')}]`);
    } catch (error: any) {
      this.logger.error(`Redis DELETE error for keys ${keys}: ${error?.message || error}`);
    }
  }
}
