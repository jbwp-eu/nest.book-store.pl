import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  ThrottlerGuard,
  type ThrottlerLimitDetail,
} from '@nestjs/throttler';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class I18nThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    _throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const i18n = I18nContext.current(context);
    throw new HttpException(
      i18n?.t('messages.tooManyRequests') ?? 'Too many requests',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
