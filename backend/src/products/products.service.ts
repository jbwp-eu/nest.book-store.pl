import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import {
  And,
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CurrentUserPayload } from '../auth/current-user.interface';
import { AwsS3Service } from '../common/aws/aws-s3.service';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductReview } from './product-review.entity';
import { Product } from './product.entity';
import {
  CloudFrontConfig,
  withSignedBanners,
  withSignedImages,
} from './utils/sign-product-assets';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductReview)
    private readonly productReviewsRepository: Repository<ProductReview>,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async findAll(query: GetProductsQueryDto) {
    const pageSize = this.configService.get<number>('PAGINATION_LIMIT', 5);
    const page = this.parsePage(query.pageNumber);
    const where = this.buildWhereClause(query);

    const [products, count] = await this.productsRepository.findAndCount({
      take: pageSize,
      skip: pageSize * (page - 1),
      where,
      order: this.getOrder(query.order, query.category),
    });

    if (products.length === 0) {
      return { products: [], pages: 0 };
    }

    const cloudFrontConfig = this.getCloudFrontConfig();

    return {
      // Każdy produkt jest przepuszczany przez withSignedImages, aby każdy z nich miał podpisane (signed) URL-e do obrazów,
      // jeśli konfiguracja CloudFront na to pozwala. Dzięki temu frontend zawsze dostanie właściwe, bezpieczne linki do zasobów,
      // niezależnie od miejsca przechowywania plików (np. lokalnie lub na AWS/S3 za pośrednictwem CloudFront).
      products: products.map((product) =>
        withSignedImages(product, cloudFrontConfig),
      ),
      pages: Math.ceil(count / pageSize),
    };
  }

  async findFeatured() {
    const products = await this.productsRepository.find({
      where: { isFeatured: true },
    });

    if (products.length === 0) {
      throw new NotFoundException(
        this.i18n.t('messages.featuredProductsNotFound'),
      );
    }

    const cloudFrontConfig = this.getCloudFrontConfig();

    return products.map((product) =>
      withSignedBanners(product, cloudFrontConfig),
    );
  }

  async findById(id: string) {
    // const product = await this.productsRepository.findOne({
    //   where: { id },
    // });
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { ProductReviews: true },
    });

    if (!product) {
      throw new NotFoundException(this.i18n.t('messages.productNotFound'));
    }

    return withSignedImages(product, this.getCloudFrontConfig());
  }

  async createReview(
    productId: string,
    dto: CreateProductReviewDto,
    user: CurrentUserPayload,
  ) {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(this.i18n.t('messages.productNotFound'));
    }

    const alreadyReviewed = await this.productReviewsRepository.exists({
      where: { Product: { id: product.id }, User: { id: user.id } },
    });

    if (alreadyReviewed) {
      throw new BadRequestException(
        this.i18n.t('messages.productAlreadyReviewed'),
      );
    }

    await this.productReviewsRepository.insert({
      title: dto.title.trim(),
      description: dto.description.trim(),
      rate: dto.rate,
      userName: user.name,
      Product: { id: product.id },
      User: { id: user.id },
    });

    const reviews = await this.productReviewsRepository.find({
      where: { Product: { id: product.id } },
    });

    product.numReviews = reviews.length;
    product.rating =
      reviews.reduce((acc, r) => acc + r.rate, 0) / reviews.length;

    await this.productsRepository.save(product);

    return {
      message: this.i18n.t('messages.reviewCreated'),
    };
  }

  async createSample() {
    const product = this.productsRepository.create({
      images: ['test', 'test_2'],
      banners: ['test_3'],
      title: 'Test',
      description: 'Sample description',
      isFeatured: true,
      price: 1,
    });

    const saved = await this.productsRepository.save(product);

    if (!saved) {
      throw new BadRequestException(
        this.i18n.t('messages.failedToCreateProduct'),
      );
    }

    const count = await this.productsRepository.count();
    const pageSize = this.configService.get<number>('PAGINATION_LIMIT', 5);

    return {
      message: this.i18n.t('messages.sampleProductCreated'),
      pages: Math.ceil(count / pageSize),
    };
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    files?: { images?: Express.Multer.File[]; banners?: Express.Multer.File[] },
  ) {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(this.i18n.t('messages.productNotFound'));
    }

    const productImages = [...product.images];
    const productBanners = [...product.banners];

    let images: string[] | undefined;
    if (files?.images && files.images.length > 0) {
      try {
        for (const image of productImages) {
          if (image.startsWith('aws')) {
            await this.awsS3Service.deleteFile(image);
          }
        }
        images = await Promise.all(
          files.images.map((file) => this.awsS3Service.uploadFile(file)),
        );
      } catch (err) {
        console.log(err);
      }
    }

    let banners: string[] | undefined;
    if (files?.banners && files.banners.length > 0) {
      try {
        if (productBanners[0]?.startsWith('aws')) {
          await this.awsS3Service.deleteFile(productBanners[0]);
        }
        banners = await Promise.all(
          files.banners.map((file) => this.awsS3Service.uploadFile(file)),
        );
      } catch (err) {
        console.log(err);
      }
    }

    product.title = dto.title ?? product.title;
    product.category = dto.category ?? product.category;
    product.countInStock = dto.countInStock ?? product.countInStock;
    product.price = dto.price ?? product.price;
    product.description = dto.description ?? product.description;
    product.images = images ?? product.images;
    product.banners = banners ?? product.banners;
    product.isFeatured = dto.isFeatured ?? product.isFeatured;

    await this.productsRepository.save(product);

    const count = await this.productsRepository.count();
    const pageSize = this.configService.get<number>('PAGINATION_LIMIT', 5);

    return {
      message: this.i18n.t('messages.productUpdated'),
      page: Math.ceil(count / pageSize),
    };
  }

  async remove(id: string) {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(this.i18n.t('messages.productNotFound'));
    }

    for (const image of product.images) {
      if (image.startsWith('aws')) {
        await this.awsS3Service.deleteFile(image);
      }
    }

    if (product.banners.length > 0 && product.banners[0].startsWith('aws')) {
      await this.awsS3Service.deleteFile(product.banners[0]);
    }

    await this.productsRepository.remove(product);

    const count = await this.productsRepository.count();
    const pageSize = this.configService.get<number>('PAGINATION_LIMIT', 5);

    return {
      message: this.i18n.t('messages.productDeleted'),
      pages: Math.ceil(count / pageSize),
    };
  }

  private parsePage(pageNumber?: string): number {
    if (!pageNumber || pageNumber === 'undefined' || !Number(pageNumber)) {
      return 1;
    }
    return Number(pageNumber);
  }

  private buildWhereClause(
    query: GetProductsQueryDto,
  ): FindOptionsWhere<Product> | FindOptionsWhere<Product>[] {
    const where: FindOptionsWhere<Product> = {};

    if (query.rating && query.rating !== 'any') {
      where.rating = MoreThanOrEqual(Number(query.rating));
    }

    if (query.price && query.price !== 'any') {
      const [min, max] = query.price.split('-');
      where.price = And(MoreThanOrEqual(Number(min)), LessThan(Number(max)));
    }

    if (query.search) {
      where.title = ILike(`%${query.search}%`);
    }

    return where;
  }

  private getOrder(
    order?: string,
    category?: string,
  ): FindOptionsOrder<Product> {
    if (order === 'ascending') {
      if (category === 'rating') return { rating: 'ASC' };
      if (category === 'price') return { price: 'ASC' };
      return { title: 'ASC' };
    }

    if (order === 'descending') {
      if (category === 'rating') return { rating: 'DESC' };
      if (category === 'price') return { price: 'DESC' };
      return { title: 'DESC' };
    }

    return { createdAt: 'ASC' };
  }

  private getCloudFrontConfig(): CloudFrontConfig {
    return {
      keyPairId: this.configService.get<string>('CLOUDFRONT_KEY_PAIR_ID'),
      privateKey: this.configService.get<string>('CLOUDFRONT_PRIVATE_KEY'),
      baseUrl: this.configService.get<string>(
        'CLOUDFRONT_BASE_URL',
        'https://d8gge2z531r61.cloudfront.net/',
      ),
    };
  }
}
