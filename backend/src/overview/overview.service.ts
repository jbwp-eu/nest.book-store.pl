import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Order } from '../orders/order.entity';
import { ProductReview } from '../products/product-review.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';

interface SalesDataRow {
  Date: string;
  Total: string;
}

@Injectable()
export class OverviewService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getOverviewData() {
    const productRepo = this.dataSource.getRepository(Product);
    const userRepo = this.dataSource.getRepository(User);
    const orderRepo = this.dataSource.getRepository(Order);
    const reviewRepo = this.dataSource.getRepository(ProductReview);

    const [productsCount, usersCount, ordersCount, reviewsCount, totalSales, orders, salesDataRaw] =
      await Promise.all([
        productRepo.count(),
        userRepo.count(),
        orderRepo.count(),
        reviewRepo.count(),
        orderRepo.sum('totalPrice'),
        orderRepo.find({
          select: {
            id: true,
            totalPrice: true,
            createdAt: true,
            User: { id: true, name: true },
          },
          relations: { User: true },
          take: 3,
          order: { createdAt: 'DESC' },
        }),
        orderRepo
          .createQueryBuilder('o')
          .select('DATE(o."createdAt")', 'Date')
          .addSelect('SUM(o."totalPrice")', 'Total')
          .groupBy('DATE(o."createdAt")')
          .orderBy('Date', 'ASC')
          .getRawMany<SalesDataRow>(),
      ]);

    const salesData = salesDataRaw.map((row) => ({
      Date: row.Date,
      Total: Number(row.Total),
    }));

    return {
      productsCount,
      usersCount,
      ordersCount,
      reviewsCount,
      totalSales: totalSales ?? 0,
      orders,
      salesData,
    };
  }
}
