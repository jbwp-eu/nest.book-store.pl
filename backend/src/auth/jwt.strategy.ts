import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CurrentUserPayload } from './current-user.interface';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.usersRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException(this.i18n.t('messages.unauthorized'));
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }
}

/* PassportStrategy(Strategy) rejestruje strategię pod domyślną nazwą jwt (z PassportModule.register({ defaultStrategy: 'jwt' }) w auth.module.ts).

Kroki strategii:

Wyciągnięcie tokenu z Authorization: Bearer <token>.
Weryfikacja podpisu kluczem JWT_SECRET (ten sam sekret co przy logowaniu w JwtModule).
Dekodowanie payloadu (np. { userId: ... }).
validate(payload) — dodatkowa logika biznesowa: użytkownik musi istnieć w bazie.
Zwrócony obiekt trafia do request.user. */