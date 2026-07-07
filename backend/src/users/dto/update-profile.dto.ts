import {
  IsEmail,
  IsOptional,
  MinLength,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidateIf,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

function UpdateProfileAtLeastOneField(validationOptions?: ValidationOptions) {
  return function (constructor: new (...args: unknown[]) => object) {
    registerDecorator({
      name: 'updateProfileAtLeastOneField',
      target: constructor,
      propertyName: 'name',
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const { name, email, password } = args.object as UpdateProfileDto;
          return [name, email, password].some(
            (field) => typeof field === 'string' && field.trim().length > 0,
          );
        },
      },
    });
  };
}

@UpdateProfileAtLeastOneField({
  message: i18nValidationMessage('messages.updateProfileAtLeastOneField'),
})
export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => typeof o.name === 'string' && o.name !== '')
  @MinLength(2, { message: i18nValidationMessage('messages.nameMinLength') })
  name?: string;

  @IsOptional()
  @ValidateIf((o: UpdateProfileDto) => typeof o.email === 'string' && o.email !== '')
  @IsEmail({}, { message: i18nValidationMessage('messages.emailInvalid') })
  email?: string;

  @IsOptional()
  @ValidateIf(
    (o: UpdateProfileDto) => typeof o.password === 'string' && o.password !== '',
  )
  @MinLength(6, { message: i18nValidationMessage('messages.passwordMinLength') })
  password?: string;
}
