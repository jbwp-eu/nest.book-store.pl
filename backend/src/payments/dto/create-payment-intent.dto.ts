import { IsInt, IsString, Min } from 'class-validator';

export class CreatePaymentIntentDto {
  @IsString()
  id: string;

  @IsInt()
  @Min(1)
  amount: number;
}
