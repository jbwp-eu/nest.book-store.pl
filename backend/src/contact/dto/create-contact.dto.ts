import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateContactDto {
  @IsNotEmpty({ message: i18nValidationMessage('messages.emailInvalid') })
  @IsEmail({}, { message: i18nValidationMessage('messages.emailInvalid') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('messages.contactTextRequired') })
  @IsString()
  text: string;
}
