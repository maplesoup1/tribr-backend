import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter
  implements ExceptionFilter<Prisma.PrismaClientKnownRequestError>
{
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const timestamp = new Date().toISOString();
    let status = HttpStatus.BAD_REQUEST;
    let message = exception.message;
    let error = 'Bad Request';
    let errorCode: string | undefined;

    // Map common Prisma codes to user-friendly responses
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint failed
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        const target = (exception.meta as any)?.target as string[] | undefined;
        const field = target?.[0];
        if (field) {
          message = `${field} is already taken`;
          errorCode = `CONFLICT_${field.toUpperCase()}`;
        } else {
          message = 'Resource already exists';
          errorCode = 'CONFLICT_UNIQUE';
        }
        break;
      }
      case 'P2025': {
        // Record not found
        status = HttpStatus.NOT_FOUND;
        error = 'Not Found';
        message = 'Resource not found';
        errorCode = 'NOT_FOUND';
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'Invalid reference';
        errorCode = 'INVALID_REFERENCE';
        break;
      }
      default: {
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'Request could not be processed';
        errorCode = exception.code;
        break;
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      errorCode,
      timestamp,
    });
  }
}
