import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, AdminGuard)
  createSample() {
    return this.productsService.createSample();
  }

  @Get()
  findAll(@Query() query: GetProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Patch(':id')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard, AdminGuard)
  // Dekorator @UseInterceptors służy do dołączania interceptorów do tego endpointa.
  // W tym przypadku wykorzystuje FileFieldsInterceptor, który umożliwia obsługę przesyłania plików
  // poprzez pola o nazwach 'images' (maksymalnie 2 pliki) oraz 'banners' (maksymalnie 1 plik) w żądaniu multipart/form-data.
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'images', maxCount: 2 },
      { name: 'banners', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles()
    files: { images?: Express.Multer.File[]; banners?: Express.Multer.File[] },
  ) {
    return this.productsService.update(id, dto, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/reviews')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  createReview(
    @Param('id') id: string,
    @Body() dto: CreateProductReviewDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.createReview(id, dto, user);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }
}
