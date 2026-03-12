import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as Error).message || 'Internal server error';

    this.logger.error(
      `Http Status: ${status} Error Message: ${JSON.stringify(message)}`,
      (exception as Error).stack,
    );

    response.status(status).json({
      statusCode: status,
      message:
        typeof message === 'object' && (message as any).message
          ? (message as any).message
          : message,
      timestamp: new Date().toISOString(),
    });
  }
}
