import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { ChatMessage } from '../chat/chat-message.entity';
import { Message } from '../contact/message.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Order } from '../orders/order.entity';
import { ProductReview } from '../products/product-review.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import products from './data/products';
import seedUsers from './data/users';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async importData(): Promise<void> {
    await this.ensureSchema();

    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD is required in .env for seed import');
    }

    const productRepo = this.dataSource.getRepository(Product);
    const userRepo = this.dataSource.getRepository(User);

    const productCount = await productRepo.count();
    if (productCount === 0) {
      await productRepo.save(
        products.map((item) => ({
          title: item.title,
          description: item.description,
          images: item.images,
          banners: item.banners ?? [],
          price: item.price,
          countInStock: item.countInStock,
          isFeatured: item.isFeatured === 'true',
          rating: item.rating,
          numReviews: item.numReviews ?? 0,
        })),
      );
      this.logger.log('Product data imported');
    } else {
      this.logger.warn(
        `Products already exist (${productCount}) — skipping product import`,
      );
      await this.backfillProductRatings(productRepo);
    }

    const adminEmail = seedUsers(adminPassword)[0].email;
    const existingAdmin = await userRepo.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      await userRepo.save(
        seedUsers(adminPassword).map((item) => ({
          name: item.name,
          email: item.email,
          password: bcrypt.hashSync(item.password, 10),
          isAdmin: item.isAdmin,
        })),
      );
      this.logger.log('User data imported');
    } else {
      this.logger.warn(`User ${adminEmail} already exists — skipping user import`);
    }
  }

  async destroyData(): Promise<void> {
    await this.deleteAll(ProductReview);
    await this.deleteAll(ChatMessage);
    await this.deleteAll(OrderItem);
    await this.deleteAll(Order);
    this.logger.log('Order & OrderItem data destroyed');

    await this.deleteAll(Message);
    this.logger.log('Message data destroyed');

    await this.deleteAll(Product);
    this.logger.log('Product data destroyed');

    await this.deleteAll(User);
    this.logger.log('User data destroyed');
  }

  /** Pierwszy deploy bez migracji — utwórz tabele, jeśli baza jest pusta. */
  private async ensureSchema(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const hasProducts = await queryRunner.hasTable('products');
      if (!hasProducts) {
        this.logger.log(
          'No schema detected — synchronizing tables (first deploy)',
        );
        await this.dataSource.synchronize();
      }
    } finally {
      await queryRunner.release();
    }
  }

  private async backfillProductRatings(
    productRepo: Repository<Product>,
  ): Promise<void> {
    for (const item of products) {
      await productRepo.update(
        { title: item.title },
        { rating: item.rating, numReviews: item.numReviews ?? 0 },
      );
    }
    this.logger.log('Product ratings backfilled from seed data');
  }

  private async deleteAll(entity: Parameters<DataSource['getRepository']>[0]) {
    await this.dataSource.createQueryBuilder().delete().from(entity).execute();
  }
}
