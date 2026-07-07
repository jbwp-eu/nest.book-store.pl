import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { I18nService } from 'nestjs-i18n';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let i18n: { t: jest.Mock };

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    i18n = {
      t: jest.fn((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: I18nService,
          useValue: i18n,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('login', () => {
    it('returns token and user data for valid credentials', async () => {
      const password = 'test1234';
      const user = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: bcrypt.hashSync(password, 10),
        isAdmin: false,
      };

      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.login({
        email: 'test@example.com',
        password,
      });

      expect(result).toEqual({
        message: 'messages.loggedIn',
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: 'signed-token',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ userId: user.id });
    });

    it('throws UnauthorizedException for invalid password', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        password: bcrypt.hashSync('correct-password', 10),
        isAdmin: false,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('creates user and returns token for a new email', async () => {
      const createdUser = {
        id: 'user-new',
        name: 'New User',
        email: 'new@example.com',
        password: 'hashed-password',
        isAdmin: false,
      };

      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(createdUser);
      usersRepository.save.mockResolvedValue(createdUser);

      const result = await service.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'test1234',
      });

      expect(result).toEqual({
        message: 'messages.userRegistered',
        name: createdUser.name,
        email: createdUser.email,
        isAdmin: false,
        token: 'signed-token',
      });
      expect(usersRepository.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalledWith({ userId: createdUser.id });
    });

    it('throws BadRequestException when email is already registered', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 'existing-user',
        email: 'taken@example.com',
      });

      await expect(
        service.register({
          name: 'New User',
          email: 'taken@example.com',
          password: 'test1234',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(usersRepository.save).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });
});
