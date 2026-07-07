import { IsOptional, IsString } from 'class-validator';

export class GetProductsQueryDto {
  @IsOptional()
  @IsString()
  pageNumber?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  order?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
