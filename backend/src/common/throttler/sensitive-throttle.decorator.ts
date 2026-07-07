import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { I18nThrottlerGuard } from './i18n-throttler.guard';
import {
  resolveSensitiveThrottlerConfig,
  SENSITIVE_THROTTLE_NAME,
} from './throttler.constants';

export function SensitiveThrottle() {
  const { ttl, limit } = resolveSensitiveThrottlerConfig();

  return applyDecorators(
    Throttle({ [SENSITIVE_THROTTLE_NAME]: { ttl, limit } }),
    UseGuards(I18nThrottlerGuard),
  );
}
