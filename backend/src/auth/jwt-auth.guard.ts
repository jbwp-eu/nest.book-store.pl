import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      const i18n = I18nContext.current(context);
      throw (
        err ??
        new UnauthorizedException(
          i18n?.t('messages.unauthorized') ?? 'Unauthorized',
        )
      );
    }
    return user;
  }
}
/* AuthGuard('jwt') z @nestjs/passport uruchamia strategię o nazwie jwt — tę samą, którą rejestruje JwtStrategy.

Guard sam nie parsuje tokenu. Jego rola:

wywołać Passport / strategię,
w handleRequest obsłużyć wynik,
przy błędzie lub braku user → 401 Unauthorized (z i18n),
przy sukcesie → zwrócić user i zapisać go w request.user.
 */
