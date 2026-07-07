import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const context = {} as ExecutionContext;

  beforeEach(() => {
    guard = new JwtAuthGuard();
    jest.spyOn(I18nContext, 'current').mockReturnValue({
      t: jest.fn().mockReturnValue('messages.unauthorized'),
    } as unknown as I18nContext);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws UnauthorizedException when user is missing', () => {
    expect(() => guard.handleRequest(null, null, null, context)).toThrow(
      UnauthorizedException,
    );
  });
});
