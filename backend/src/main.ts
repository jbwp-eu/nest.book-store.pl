import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger();
  // Użycie opcji { rawBody: true } powoduje, że NestJS udostępnia "surowe body" (nieprzetworzone dane żądania)
  // w obiekcie req.rawBody. Jest to przydatne np. przy obsłudze webhooków Stripe, które wymagają dokładnego
  // odczytu oryginalnego ciągu bajtów żądania do weryfikacji podpisu (signature check). Dzięki temu
  // możemy bezpiecznie zweryfikować autentyczność żądania zanim zostanie ono sparsowane np. do JSON.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      detailedErrors: false,
      responseBodyFormatter: (_host, _exc, errors) => ({
        message: (errors as string[])[0],
      }),
    }),
    new HttpExceptionFilter(),
  );
  // Tak, ten pipe jest powiązany z 'class-validator'.
  // I18nValidationPipe działa w oparciu o mechanizm 'class-validator', który pozwala stosować dekoratory
  // takie jak @IsString, @IsEmail itp. na klasach DTO.
  // Dzięki temu, przed przetworzeniem żądań w NestJS, dane przesyłane przez użytkownika
  // są walidowane zgodnie z regułami zdefiniowanymi przez dekoratory z 'class-validator'.
  // Pipe ten dodatkowo obsługuje tłumaczenie komunikatów błędów walidacyjnych (i18n).
  // Opcja whitelist: true sprawia, że wszystkie nieznane właściwości w żądaniu są automatycznie usuwane.
  // whitelist: true – usuwa wszystkie pola z danych wejściowych, które nie są zdefiniowane w DTO.
  // Dzięki temu użytkownik nie może przesłać dodatkowych, nieoczekiwanych właściwości.
  // transform: true – automatycznie konwertuje dane wejściowe na odpowiednie typy zgodne z deklaracją w DTO,
  // np. string na liczbę itp. Pozwala to na bardziej elastyczne przyjmowanie parametrów wejściowych.
  app.useGlobalPipes(new I18nValidationPipe({ whitelist: true, transform: true }));
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3004);
  const host = configService.get<string>('HOST', '127.0.0.1');
  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port}/api`);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
