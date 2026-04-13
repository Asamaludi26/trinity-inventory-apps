import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
}

/**
 * Unified exception filter — catches ALL exceptions.
 * Merges HttpExceptionFilter + PrismaExceptionFilter + generic catch-all.
 *
 * @see ERROR_HANDLING.md §2.1
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildResponse(exception, request);

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${errorResponse.statusCode} - ${JSON.stringify(errorResponse.message)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${errorResponse.statusCode} - ${JSON.stringify(errorResponse.message)}`,
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponseBody {
    const base = {
      success: false as const,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // ─── HttpException (NestJS built-in + custom) ───
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResp = exception.getResponse();
      const message =
        typeof exceptionResp === 'string'
          ? exceptionResp
          : (exceptionResp as Record<string, unknown>).message ||
            exception.message;

      return {
        ...base,
        statusCode: status,
        message: message as string | string[],
        error: exception.name,
      };
    }

    // ─── Prisma Connection / Initialization Error ───
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        ...base,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection unavailable. Please try again later.',
        error: 'ServiceUnavailable',
      };
    }

    // ─── Prisma Known Request Error ───
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return { ...base, ...this.mapPrismaCode(exception) };
    }

    // ─── Prisma Validation Error ───
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        ...base,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid database query parameters.',
        error: 'BadRequest',
      };
    }

    // ─── Generic catch-all ───
    return {
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
    };
  }

  private mapPrismaCode(
    exception: Prisma.PrismaClientKnownRequestError,
  ): Pick<ErrorResponseBody, 'statusCode' | 'message' | 'error'> {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Data already exists. Unique constraint failed on: ${(exception.meta?.target as string[])?.join(', ')}`,
          error: 'Conflict',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Related record not found. Foreign key constraint failed.',
          error: 'BadRequest',
        };
      case 'P2014':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'Required relation violation. The change would violate a required relation.',
          error: 'BadRequest',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found.',
          error: 'NotFound',
        };
      default:
        if (exception.message.includes('ECONNREFUSED')) {
          return {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Database connection unavailable. Please try again later.',
            error: 'ServiceUnavailable',
          };
        }
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
          error: 'InternalServerError',
        };
    }
  }
}
