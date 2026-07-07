import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  I18nValidationExceptionFilter,
  I18nValidationPipe,
} from 'nestjs-i18n';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

/**
 * Testy e2e uruchamiają pełną aplikację (AppModule) razem z bazą PostgreSQL.
 * Wymagają działającej bazy z pliku .env oraz zaseedowanych danych
 * (np. `npm run seed -- -i`).
 *
 * Konfiguracja aplikacji (prefix /api, pipe'y, filtry) odwzorowuje main.ts.
 */
describe('Backend (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api');
    app.useGlobalFilters(
      new I18nValidationExceptionFilter({
        detailedErrors: false,
        responseBodyFormatter: (_host, _exc, errors) => ({
          message: (errors as string[])[0],
        }),
      }),
      new HttpExceptionFilter(),
    );
    app.useGlobalPipes(
      new I18nValidationPipe({ whitelist: true, transform: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/config', () => {
    it('returns the configured store currency', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/config')
        .expect(200);

      expect(response.body).toEqual({ currency: 'PLN' });
    });
  });

  describe('GET /api/products', () => {
    it('returns a paginated products payload', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body).toHaveProperty('pages');
    });
  });

  describe('POST /api/users/login', () => {
    it('rejects invalid credentials with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' })
        .expect(401);
    });

    it('logs in as admin and returns profile from /users/me', async () => {
      const adminPassword = app.get(ConfigService).get<string>('ADMIN_PASSWORD');
      if (!adminPassword) {
        throw new Error(
          'ADMIN_PASSWORD is required in .env — run seed with npm run seed -- -i',
        );
      }

      const loginResponse = await request(app.getHttpServer())
        .post('/api/users/login')
        .send({ email: 'admin@test.pl', password: adminPassword })
        .expect(200);

      expect(loginResponse.body.token).toEqual(expect.any(String));
      expect(loginResponse.body.isAdmin).toBe(true);

      const meResponse = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(meResponse.body).toMatchObject({
        email: 'admin@test.pl',
        isAdmin: true,
      });
      expect(meResponse.body.id).toEqual(expect.any(String));
    });
  });

  describe('GET /api/users/me', () => {
    it('rejects requests without a token with 401', async () => {
      await request(app.getHttpServer()).get('/api/users/me').expect(401);
    });
  });
});
