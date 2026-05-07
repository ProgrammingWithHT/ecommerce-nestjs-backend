import {
  BadGatewayException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RpcClientService {
  async send<TResult, TPayload>(
    client: ClientProxy,
    pattern: unknown,
    payload: TPayload,
  ) {
    try {
      return await firstValueFrom(client.send<TResult, TPayload>(pattern, payload));
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      'message' in error
    ) {
      const response = error as {
        error?: string;
        message: string | string[];
        statusCode: number;
      };

      return new HttpException(
        {
          error: response.error ?? 'MicroserviceError',
          message: response.message,
        },
        response.statusCode,
      );
    }

    return new BadGatewayException('Failed to reach downstream service');
  }
}
