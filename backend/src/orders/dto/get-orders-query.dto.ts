import { IsOptional, IsString } from 'class-validator';

export class GetOrdersQueryDto {
  @IsOptional()
  @IsString()
  pageNumber?: string;
}
