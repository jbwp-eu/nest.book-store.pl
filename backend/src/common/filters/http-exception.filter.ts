import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const i18n = I18nContext.current(host);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message =
      i18n?.t('messages.unknownError') ?? 'An unknown error occurred !';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const rawMessage = (exceptionResponse as { message: string | string[] })
          .message;
        message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    console.log('err:', exception);
    response.status(statusCode).json({ message });
  }
}
