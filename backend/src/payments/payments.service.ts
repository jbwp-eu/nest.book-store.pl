import {

  BadRequestException,

  Injectable,

  Logger,

  NotFoundException,

  UnauthorizedException,

} from '@nestjs/common';

import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { I18nService } from 'nestjs-i18n';

import { DataSource, Repository } from 'typeorm';

import { MailService } from '../common/mail/mail.service';
import { OrderConfirmationQueueService } from '../common/mail/order-confirmation-queue.service';

import { Order } from '../orders/order.entity';

import { Product } from '../products/product.entity';

import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';

import { StripeService } from './stripe.service';

import { StripeWebhookEvent } from './stripe-webhook-event.entity';

import type {
  StripeEvent,
  StripePaymentIntentObject,
} from './stripe.types';

type MarkOrderPaidResult = {
  newlyPaid: boolean;
  orderId: string | null;
};


@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(

    @InjectRepository(Order)

    private readonly orderRepository: Repository<Order>,

    @InjectRepository(StripeWebhookEvent)

    private readonly stripeWebhookEventRepository: Repository<StripeWebhookEvent>,

    @InjectDataSource()

    private readonly dataSource: DataSource,

    private readonly stripeService: StripeService,

    private readonly mailService: MailService,

    private readonly orderConfirmationQueue: OrderConfirmationQueueService,

    private readonly i18n: I18nService,

  ) {}


  async tryRecordStripeEvent(eventId: string): Promise<boolean> {

    // Próbuje zapisać rekord webhooka Stripe o danym eventId do bazy danych.
    // Używa insert ... on conflict do tabeli StripeWebhookEvent (czyli tylko jeśli nie istnieje duplikat).
    // Dzięki temu metoda pozwala wykryć, czy event o tym ID był już przetwarzany wcześniej (zabezpiecza przed obsługą tego samego webhooka kilkukrotnie).
    // Zwraca true, jeśli to pierwsza próba obsługi (czyli rekord został dodany do bazy); false, jeśli taki event już był.
    const result = await this.stripeWebhookEventRepository
      .createQueryBuilder()
      .insert()
      .into(StripeWebhookEvent)
      .values({ id: eventId })
      .orIgnore()
      .returning('id')
      .execute();
    return (result.raw as { id: string }[]).length > 0;
  }


  async applyStripeWebhookEvent(event: StripeEvent) {

    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentIntentSucceeded(event.data.object);
      case 'payment_intent.payment_failed':

      case 'payment_intent.canceled':

        return this.handlePaymentIntentFailedOrCanceled(event.data.object);

      default:

        return { received: true as const };

    }

  }


  async createPaymentIntent(dto: CreatePaymentIntentDto) {
 
    const order = await this.orderRepository.findOne({
      where: { id: dto.id },
    });

    if (!order) {
      throw new NotFoundException(this.i18n.t('messages.orderNotFound'));
    }

    if (order.isPaid) {
      throw new BadRequestException(this.i18n.t('messages.orderAlreadyPaid'));
    }

    const amount = Math.round(Number(order.totalPrice) * 100);

    if (amount < 1) {
     throw new BadRequestException(this.i18n.t('messages.incorrectAmountPaid'));
    }

    if (dto.amount !== amount) {
      throw new BadRequestException(
        this.i18n.t('messages.incorrectAmountPaid'),
      );
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(
      amount,
      'pln',
    );

    order.stripePaymentIntentId = paymentIntent.id;

    await this.orderRepository.save(order);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }


  async handlePaymentIntentSucceeded(paymentIntent: StripePaymentIntentObject) {
    const order = await this.orderRepository.findOne({

      where: { stripePaymentIntentId: paymentIntent.id },

    });
    if (!order) {

      this.logger.warn(

        `payment_intent.succeeded: no order for PI ${paymentIntent.id}`,

      );

      return { received: true as const, newlyPaid: false };
    }

    const paidCorrectAmount =

      Number(order.totalPrice).toFixed(2) ===

      (paymentIntent.amount / 100).toFixed(2);
    if (!paidCorrectAmount) {
      throw new UnauthorizedException(
        this.i18n.t('messages.incorrectAmountPaid'),
      );
    }

    const result = await this.markOrderPaid(order, {

      paymentResult: {

        id: paymentIntent.id,

        status: 'COMPLETED',

        update_time: paymentIntent.created,

      },

      stripePaymentIntentId: paymentIntent.id,

    });

    if (!result.newlyPaid || !result.orderId) {
      return { received: true as const, newlyPaid: false };
    }

    try {
    //  this.mailService.sendPurchaseReceipt(result.orderId);
      await this.notifyPurchaseReceipt(result.orderId);
    } catch (err) {

      this.logger.warn(
        `Purchase receipt notification failed for order ${result.orderId}`,
        err instanceof Error ? err.stack : err,
      );
    }

    return { received: true as const, newlyPaid: true };
  }


  async handlePaymentIntentFailedOrCanceled(
    paymentIntent: StripePaymentIntentObject,
  ) {
    const cancelled = await this.cancelUnpaidOrderByStripePaymentIntentId(
      paymentIntent.id,
    );
    if (cancelled) {
      this.logger.log(
        `Unpaid order cancelled; stock restored for PI ${paymentIntent.id}`,
      );
    }
    return { received: true as const, cancelled };
  }


  private async notifyPurchaseReceipt(orderId: string): Promise<void> {
    const enqueued = await this.orderConfirmationQueue.tryEnqueue(orderId);
    if (enqueued) {
      return;
    }
    await this.mailService.sendPurchaseReceipt(orderId);
  }

  private async markOrderPaid(
    order: Order,
    params: {
      paymentResult: Record<string, unknown>;
      stripePaymentIntentId: string | null;
    },
  ): Promise<MarkOrderPaidResult> {
    return this.dataSource.transaction(async (manager) => {
      const lockedOrder = await manager.findOne(Order, {
        where: { id: order.id, isPaid: false },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedOrder) {
        return { newlyPaid: false, orderId: order.id };
      }

      lockedOrder.isPaid = true;
      lockedOrder.paidAt = new Date();
      lockedOrder.paymentResult = params.paymentResult;
      if (params.stripePaymentIntentId) {
        lockedOrder.stripePaymentIntentId = params.stripePaymentIntentId;
      }

      await manager.save(lockedOrder);
      return { newlyPaid: true, orderId: lockedOrder.id };
    });
  }


  private async cancelUnpaidOrderByStripePaymentIntentId(

    stripePaymentIntentId: string,

  ): Promise<boolean> {

    return this.dataSource.transaction(async (manager) => {

      const order = await manager.findOne(Order, {

        where: { stripePaymentIntentId, isPaid: false },

        relations: { OrderItems: true },

      });



      if (!order) {

        return false;

      }



      for (const item of order.OrderItems) {

        await manager.increment(

          Product,

          { id: item.product },

          'countInStock',

          item.quantity,

        );

      }



      await manager.remove(order);

      return true;

    });
  }
}