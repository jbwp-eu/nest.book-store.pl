import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Ta funkcja 'useFactory' zwraca konfigurację dla modułu JwtModule.
      // Pobiera ona z ConfigService sekret JWT (klucz używany do podpisywania tokenów)
      // oraz ustawia czas ważności tokenu na 1 godzinę.
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [JwtStrategy, JwtAuthGuard, AdminGuard],
  exports: [JwtModule, PassportModule, JwtAuthGuard, AdminGuard],
  /* JwtService pochodzi z JwtModule */
})
export class AuthModule {}
