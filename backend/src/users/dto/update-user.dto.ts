import {
  IsBoolean,
  IsEmail,
  IsOptional,
  MinLength,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

function UpdateUserAtLeastOneField(validationOptions?: ValidationOptions) {
  return function (constructor: new (...args: unknown[]) => object) {
    registerDecorator({
      name: 'updateUserAtLeastOneField',
      target: constructor,
      propertyName: 'name',
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const { name, email, isAdmin } = args.object as UpdateUserDto;
          return (
            (typeof name === 'string' && name.trim().length > 0) ||
            (typeof email === 'string' && email.trim().length > 0) ||
            typeof isAdmin === 'boolean'
          );
        },
      },
    });
  };
}

@UpdateUserAtLeastOneField({
  message: i18nValidationMessage('messages.updateUserAtLeastOneField'),
})
export class UpdateUserDto {
  @IsOptional()
  @ValidateIf((o: UpdateUserDto) => typeof o.name === 'string' && o.name !== '')
  @MinLength(2, { message: i18nValidationMessage('messages.nameMinLength') })
  name?: string;

  @IsOptional()
  @ValidateIf((o: UpdateUserDto) => typeof o.email === 'string' && o.email !== '')
  @IsEmail({}, { message: i18nValidationMessage('messages.emailInvalid') })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('messages.isAdminInvalid') })
  isAdmin?: boolean;
}
