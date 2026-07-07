import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateProductReviewDto {
  @IsNotEmpty({ message: i18nValidationMessage('messages.reviewTitleRequired') })
  @IsString()
  title: string;

  @IsNotEmpty({
    message: i18nValidationMessage('messages.reviewDescriptionRequired'),
  })
  @IsString()
  description: string;

  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt({ message: i18nValidationMessage('messages.reviewRateInvalid') })
  @Min(1, { message: i18nValidationMessage('messages.reviewRateInvalid') })
  @Max(5, { message: i18nValidationMessage('messages.reviewRateInvalid') })
  rate: number;
}
