import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../contact/message.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Order } from '../orders/order.entity';
import { ProductReview } from '../products/product-review.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/user.entity';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Product,
      User,
      Order,
      OrderItem,
      Message,
      ProductReview,
    ]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
