import { IsOptional, IsString } from 'class-validator';

export class GetReviewsQueryDto {
  @IsOptional()
  @IsString()
  pageNumber?: string;
}
