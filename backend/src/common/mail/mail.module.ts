import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../orders/order.entity';
import { MailService } from './mail.service';
import { OrderConfirmationQueueService } from './order-confirmation-queue.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Order])],
  providers: [MailService, OrderConfirmationQueueService],
  exports: [MailService, OrderConfirmationQueueService],
})
export class MailModule {}
