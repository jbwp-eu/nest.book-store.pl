import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { StripeClient, StripeEvent, StripePaymentIntent } from './stripe.types';

@Injectable()
export class StripeService {
  private readonly stripe: StripeClient;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY_TEST_MODE'),
    );
  }

  createPaymentIntent(
    amount: number,
    currency: string,
  ): Promise<StripePaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
    });
  }
  constructEvent(
    payload: Buffer,
    signature: string,
  ): StripeEvent {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET_TEST_MODE',
    );
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
