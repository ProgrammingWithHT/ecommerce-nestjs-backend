import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(err: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal Server Error';

        // NestJS HTTP Exceptions
        if (err instanceof HttpException) {
            statusCode = err.getStatus();

            const response = err.getResponse();

            if (typeof response === 'string') {
                message = response;
            } else if (typeof response === 'object' && response !== null) {
                message = (response as any).message || response;
            }
        }

        // Wrong MongoDB ObjectId
        else if (err.name === 'CastError') {
            statusCode = HttpStatus.BAD_REQUEST;
            message = `Resource not found. Invalid: ${err.path}`;
        }

        // Duplicate Key Error (11000)
        else if (err.code === 11000) {
            statusCode = HttpStatus.BAD_REQUEST;
            const field = Object.keys(err.keyValue)[0];
            message = `Duplicate ${field} entered`;
        }

        // JWT Invalid
        else if (err.name === 'JsonWebTokenError') {
            statusCode = HttpStatus.UNAUTHORIZED;
            message = 'JWT is invalid, try again';
        }

        // JWT Expired
        else if (err.name === 'TokenExpiredError') {
            statusCode = HttpStatus.UNAUTHORIZED;
            message = 'JWT is expired, try again';
        } else if (
            err.name === 'MongoNetworkError' ||
            err.name === 'MongoServerSelectionError' ||
            err.name === 'MongooseServerSelectionError'
        ) {
            statusCode = HttpStatus.SERVICE_UNAVAILABLE;
            message = 'Database connection error. Please try again later';
        }

        response.status(statusCode).json({
            success: false,
            message,
            // remove in production:
            error: err.stack,
        });

    }
}