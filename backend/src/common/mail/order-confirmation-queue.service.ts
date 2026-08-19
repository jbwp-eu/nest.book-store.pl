import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../orders/order.entity';

export type OrderConfirmationMessage = {
  orderId: string;
  userEmail: string;
  userName: string;
  itemsPrice: number;
  shippingPrice: number;
  totalPrice: number;
  paidAt: string;
  items: Array<{ title: string; quantity: number; price: number }>;
  shippingAddress: {
    address: string;
    city: string;
    code: string;
  };
  adminEmail?: string;
  language: 'pl' | 'en';
};

@Injectable()
export class OrderConfirmationQueueService {
  private readonly logger = new Logger(OrderConfirmationQueueService.name);
  private sqsClient: SQSClient | null = null;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly configService: ConfigService,
  ) {}

  /** Returns true when message was enqueued; false when queue is not configured. */
  isConfigured(): boolean {
    const url = this.configService
      .get<string>('ORDER_CONFIRMATION_QUEUE_URL')
      ?.trim();
    return Boolean(url);
  }

  async tryEnqueue(
    orderId: string,
    language: 'pl' | 'en' = 'pl',
  ): Promise<boolean> {
    const queueUrl = this.configService
      .get<string>('ORDER_CONFIRMATION_QUEUE_URL')
      ?.trim();
    if (!queueUrl) {
      return false;
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { User: true, OrderItems: true },
    });

    if (!order) {
      this.logger.warn(`order confirmation skipped: order not found ${orderId}`);
      return true;
    }

    const message = this.orderToMessage(order, language);
    if (!message) {
      this.logger.warn(
        `order confirmation skipped: no customer email for ${orderId}`,
      );
      return true;
    }

    try {
      await this.getSqsClient().send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(message),
        }),
      );
      this.logger.log(`order confirmation email enqueued for ${orderId}`);
      return true;
    } catch (err) {
      this.logger.error(
        `failed to enqueue order confirmation for ${orderId}`,
        err instanceof Error ? err.stack : err,
      );
      throw err;
    }
  }

  private getSqsClient(): SQSClient {
    if (!this.sqsClient) {
      const region =
        this.configService.get<string>('AWS_REGION')?.trim() ||
        'eu-central-1';
      this.sqsClient = new SQSClient({ region });
    }
    return this.sqsClient;
  }

  private orderToMessage(
    order: Order,
    language: 'pl' | 'en' = 'pl',
  ): OrderConfirmationMessage | null {
    const userEmail = order.User?.email?.trim();
    if (!userEmail) {
      return null;
    }

    const adminEmail = this.configService.get<string>('TO_3')?.trim();

    return {
      orderId: order.id,
      userEmail,
      userName: order.User.name,
      itemsPrice: Number(order.itemsPrice),
      shippingPrice: Number(order.shippingPrice),
      totalPrice: Number(order.totalPrice),
      paidAt: (order.paidAt ?? new Date()).toISOString(),
      items: (order.OrderItems ?? []).map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      shippingAddress: order.shippingAddress,
      ...(adminEmail ? { adminEmail } : {}),
      language: language === 'en' ? 'en' : 'pl',
    };
  }
}
