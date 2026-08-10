import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { StripeClient, StripeEvent, StripePaymentIntent } from './stripe.types';

type DeployTarget = 'ovh' | 'aws';

@Injectable()
export class StripeService {
  private readonly stripe: StripeClient;
  private readonly deployTarget: DeployTarget;

  constructor(private readonly configService: ConfigService) {
    this.deployTarget =
      this.configService.get<string>('DEPLOY_TARGET') === 'aws'
        ? 'aws'
        : 'ovh';
    this.stripe = new Stripe(this.stripeEnv('STRIPE_SECRET_KEY_TEST_MODE'));
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

  constructEvent(payload: Buffer, signature: string): StripeEvent {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.stripeEnv('STRIPE_WEBHOOK_SECRET_TEST_MODE'),
    );
  }

  private stripeEnv(
    base: 'STRIPE_SECRET_KEY_TEST_MODE' | 'STRIPE_WEBHOOK_SECRET_TEST_MODE',
  ): string {
    const suffix = this.deployTarget === 'aws' ? 'AWS' : 'OVH';
    return this.configService.getOrThrow<string>(`${base}_${suffix}`);
  }
}
