import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterDto {
  @IsNotEmpty({ message: i18nValidationMessage('messages.registerNameMinLength') })
  @MinLength(2, {
    message: i18nValidationMessage('messages.registerNameMinLength'),
  })
  name: string;

  @IsNotEmpty({ message: i18nValidationMessage('messages.emailInvalid') })
  @IsEmail({}, { message: i18nValidationMessage('messages.emailInvalid') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('messages.passwordMinLength') })
  @MinLength(6, { message: i18nValidationMessage('messages.passwordMinLength') })
  password: string;
}
