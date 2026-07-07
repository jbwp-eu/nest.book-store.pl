import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ShippingAddressDto {
  @IsNotEmpty({
    message: i18nValidationMessage('messages.shippingAddressRequired'),
  })
  @IsString()
  address: string;

  @IsNotEmpty({
    message: i18nValidationMessage('messages.shippingAddressRequired'),
  })
  @IsString()
  city: string;

  @IsNotEmpty({
    message: i18nValidationMessage('messages.shippingAddressRequired'),
  })
  @IsString()
  code: string;
}

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ArrayMinSize(1, {
    message: i18nValidationMessage('messages.noOrderItems'),
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;
}
