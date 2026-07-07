import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../common/mail/mail.module';
import { Order } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookEvent } from './stripe-webhook-event.entity';
import { StripeService } from './stripe.service';

@Module({
  imports: [
    ConfigModule,
    MailModule,
    TypeOrmModule.forFeature([Order, Product, StripeWebhookEvent]),
  ],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [PaymentsService, StripeService],
})
export class PaymentsModule {}
