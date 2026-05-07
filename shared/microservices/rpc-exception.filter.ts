import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class RpcExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      return super.catch(exception, host);
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      return super.catch(
        new RpcException(
          typeof response === 'string'
            ? {
                statusCode: exception.getStatus(),
                message: response,
                error: exception.name,
              }
            : {
                statusCode: exception.getStatus(),
                ...(response as Record<string, unknown>),
              },
        ),
        host,
      );
    }

    return super.catch(
      new RpcException({
        statusCode: 500,
        message: 'Internal service error',
        error: 'InternalServerError',
      }),
      host,
    );
  }
}
