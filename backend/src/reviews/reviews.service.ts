import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import { CurrentUserPayload } from '../auth/current-user.interface';
import { ProductReview } from '../products/product-review.entity';
import { Product } from '../products/product.entity';
import { GetReviewsQueryDto } from './dto/get-reviews-query.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: GetReviewsQueryDto) {
    const pageSize = this.configService.get<number>('PAGINATION_LIMIT', 5);
    const page = this.parsePage(query.pageNumber);

    const [reviews, count] = await this.dataSource
      .getRepository(ProductReview)
      .findAndCount({
        take: pageSize,
        skip: pageSize * (page - 1),
        relations: { Product: true, User: true },
      });

    if (reviews.length === 0) {
      throw new NotFoundException(this.i18n.t('messages.reviewsNotFound'));
    }

    return {
      reviews,
      pages: Math.ceil(count / pageSize),
    };
  }

  async findMine(user: CurrentUserPayload) {
    const reviews = await this.dataSource.getRepository(ProductReview).find({
      where: { User: { id: user.id } },
      relations: { Product: true },
    });

    if (reviews.length === 0) {
      throw new NotFoundException(this.i18n.t('messages.reviewsNotFound'));
    }

    return reviews;
  }

  async remove(id: string) {
    await this.dataSource.transaction(async (manager) => {
      const review = await manager.findOne(ProductReview, {
        where: { id },
        relations: { Product: true },
      });

      if (!review) {
        throw new NotFoundException(this.i18n.t('messages.reviewNotFound'));
      }

      const product = await manager.findOne(Product, {
        where: { id: review.Product.id },
        relations: { ProductReviews: true },
      });

      if (!product) {
        throw new NotFoundException(this.i18n.t('messages.productNotFound'));
      }

      await manager.remove(review);

      const remainingReviews = product.ProductReviews.filter(
        (r) => r.id !== id,
      );

      product.numReviews = remainingReviews.length;
      product.rating =
        remainingReviews.length > 0
          ? remainingReviews.reduce((acc, r) => acc + r.rate, 0) /
            remainingReviews.length
          : 0;

      await manager.save(product);
    });

    return {
      message: this.i18n.t('messages.reviewDeleted'),
    };
  }

  private parsePage(pageNumber?: string): number {
    if (!pageNumber || pageNumber === 'undefined' || !Number(pageNumber)) {
      return 1;
    }
    return Number(pageNumber);
  }
}
