import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Request, Response } from 'express';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientInitializationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientInitializationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Handle initialization/connection errors
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return this.handleConnectionError(exception, request, response);
    }

    // Handle known request errors (with error codes)
    return this.handleKnownRequestError(exception, request, response);
  }

  private handleConnectionError(
    exception: Prisma.PrismaClientInitializationError,
    request: Request,
    response: Response,
  ) {
    this.logger.error(
      'Database connection failed. Is PostgreSQL running?',
      exception.stack,
    );

    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      success: false,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: 'Database connection unavailable. Please try again later.',
    });
  }

  private handleKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
    request: Request,
    response: Response,
  ) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = `Data already exists. Unique constraint failed on: ${(exception.meta?.target as string[])?.join(', ')}`;
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record not found. Foreign key constraint failed.';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
        break;
      default:
        // Connection errors wrapped as known request errors (Prisma driver adapters)
        if (exception.message.includes('ECONNREFUSED')) {
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = 'Database connection unavailable. Please try again later.';
          this.logger.error(
            'Database connection refused. Is PostgreSQL running?',
            exception.stack,
          );
        } else {
          this.logger.error(
            `Unhandled Prisma error: ${exception.code}`,
            exception.stack,
          );
        }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }
}
