import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { CurrentUserPayload } from './current-user.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    const user = request.user;
    const i18n = I18nContext.current(context);

    if (user?.isAdmin) {
      return true;
    }

    throw new UnauthorizedException(
      i18n?.t('messages.forbiddenAdmin') ?? 'Forbidden',
    );
  }
}
