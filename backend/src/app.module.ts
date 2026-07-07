import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { existsSync } from 'fs';
import { join } from 'path';
import { configSchema } from '../config.schema';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { OverviewModule } from './overview/overview.module';
import { ContactModule } from './contact/contact.module';
import { ChatModule } from './chat/chat.module';
import { StoreLocationModule } from './store-location/store-location.module';
import { SeederModule } from './seeder/seeder.module';
import { I18nThrottlerGuard } from './common/throttler/i18n-throttler.guard';
import { resolveSensitiveThrottlerConfig } from './common/throttler/throttler.constants';

const i18nPath =
  [join(__dirname, 'i18n'), join(__dirname, '../i18n')].find((path) =>
    existsSync(path),
  ) ?? join(__dirname, 'i18n');

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      validationSchema: configSchema,
    }),
    // ThrottlerModule ogranicza liczbę żądań (ratelimit) wysyłanych przez użytkowników w określonym czasie,
    // co zabezpiecza API przed nadużyciami i atakami (np. brute force, DDoS).
    // Konfiguracja ładuje limity z osobnej funkcji resolveSensitiveThrottlerConfig (możliwe, że bierze dane z env lub logiki runtime).
    // Dla każdego parametru (name, ttl, limit):
    //   - name: identyfikator konfiguracji throttlera
    //   - ttl: czas resetu okna (w sekundach)
    //   - limit: maksymalna liczba żądań w tym czasie
    // Dzięki forRootAsync można dynamicznie pobierać limity przy starcie aplikacji.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => {
        const { name, ttl, limit } = resolveSensitiveThrottlerConfig();
        return [{ name, ttl, limit }];
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: i18nPath,
        watch: true,
      },
      resolvers: [
        // new HeaderResolver(['x-app-locale']),
        // Sposób użycia:
        // Dzięki temu resolverowi, aplikacja korzysta z nagłówka "x-app-locale", żeby wybrać odpowiedni język (locale) dla żądań użytkownika.
        // Użytkownik może wysłać żądanie z nagłówkiem HTTP np. "x-app-locale: pl", aby wymusić wersję polską.
        new HeaderResolver(['x-app-locale']),
        new QueryResolver(['language']),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true, /* TypeORM ładuje wszystkie encje z modułów */
        synchronize: false, /* Na podstawie tych encji aktualizuje PostgreSQL */
      }),
    }),
    UsersModule,
    ProductsModule,
    OrdersModule,
    ReviewsModule,
    PaymentsModule,
    OverviewModule,
    ContactModule,
    ChatModule,
    StoreLocationModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService, I18nThrottlerGuard],
})
export class AppModule {}
