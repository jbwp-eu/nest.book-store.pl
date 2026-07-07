import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersRepository: { findOne: jest.Mock };
  let i18n: { t: jest.Mock };

  beforeEach(() => {
    usersRepository = { findOne: jest.fn() };
    i18n = { t: jest.fn().mockReturnValue('messages.unauthorized') };
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    strategy = new JwtStrategy(
      usersRepository as unknown as Repository<User>,
      configService as unknown as ConfigService,
      i18n as unknown as I18nService,
    );
  });

  describe('validate', () => {
    it('returns current user payload when user exists', async () => {
      const user = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        isAdmin: true,
      };
      usersRepository.findOne.mockResolvedValue(user);

      await expect(strategy.validate({ userId: user.id })).resolves.toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        strategy.validate({ userId: 'missing-user' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
