import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AwsS3Service } from '../common/aws/aws-s3.service';
import { ProductReview } from './product-review.entity';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: { findAndCount: jest.Mock };

  beforeEach(async () => {
    productsRepository = { findAndCount: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productsRepository,
        },
        {
          provide: getRepositoryToken(ProductReview),
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(5) },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn() },
        },
        {
          provide: AwsS3Service,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('findAll', () => {
    it('returns empty result when no products match', async () => {
      productsRepository.findAndCount.mockResolvedValue([[], 0]);

      await expect(service.findAll({})).resolves.toEqual({
        products: [],
        pages: 0,
      });
    });
  });
});
