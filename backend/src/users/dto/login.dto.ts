import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @IsNotEmpty({ message: i18nValidationMessage('messages.emailInvalid') })
  @IsEmail({}, { message: i18nValidationMessage('messages.emailInvalid') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('messages.passwordInvalid') })
  @MinLength(6, { message: i18nValidationMessage('messages.passwordMinLength') })
  password: string;
}
