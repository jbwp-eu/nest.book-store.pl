import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
    jest.spyOn(I18nContext, 'current').mockReturnValue({
      t: jest.fn().mockReturnValue('messages.forbiddenAdmin'),
    } as unknown as I18nContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createContext(isAdmin: boolean): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            isAdmin,
          },
        }),
      }),
    } as ExecutionContext;
  }

  it('allows access for admin users', () => {
    expect(guard.canActivate(createContext(true))).toBe(true);
  });

  it('denies access for non-admin users', () => {
    expect(() => guard.canActivate(createContext(false))).toThrow(
      UnauthorizedException,
    );
  });
});
