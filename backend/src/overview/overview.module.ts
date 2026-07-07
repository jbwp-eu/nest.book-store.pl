import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Order } from '../orders/order.entity';
import { ProductReview } from '../products/product-review.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Product, User, Order, ProductReview]),
  ],
  controllers: [OverviewController],
  providers: [OverviewService],
})
export class OverviewModule {}
