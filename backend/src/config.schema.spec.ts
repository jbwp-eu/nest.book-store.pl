import { describe, expect, it } from '@jest/globals';
import { configSchema } from '../config.schema';

const validBase = {
  DB_HOST: 'localhost',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'bookstore',
  DEPLOY_TARGET: 'ovh',
  STRIPE_SECRET_KEY_TEST_MODE_OVH: 'sk_test_ci',
  STRIPE_WEBHOOK_SECRET_TEST_MODE_OVH: 'whsec_ci',
};

describe('configSchema JWT_SECRET', () => {
  it('rejects missing, short, and known placeholders', () => {
    expect(configSchema.validate({ ...validBase }).error).toBeDefined();
    expect(
      configSchema.validate({ ...validBase, JWT_SECRET: 'short' }).error,
    ).toBeDefined();
    expect(
      configSchema.validate({ ...validBase, JWT_SECRET: 'your_jwt_secret' })
        .error,
    ).toBeDefined();
    expect(
      configSchema.validate({
        ...validBase,
        JWT_SECRET: 'change_me_long_random_secret',
      }).error,
    ).toBeDefined();
  });

  it('accepts a random secret of at least 32 characters', () => {
    const { error, value } = configSchema.validate({
      ...validBase,
      JWT_SECRET: 'a'.repeat(32),
    });
    expect(error).toBeUndefined();
    expect(value.JWT_SECRET).toBe('a'.repeat(32));
  });
});
