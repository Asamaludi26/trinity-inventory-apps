import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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
        this.logger.error(
          `Unhandled Prisma error: ${exception.code}`,
          exception.stack,
        );
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
