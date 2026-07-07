import Stripe from 'stripe';

export type StripeClient = InstanceType<typeof Stripe>;

export type StripePaymentIntent = Awaited<
  ReturnType<StripeClient['paymentIntents']['create']>
>;

export type StripeEvent = ReturnType<
  StripeClient['webhooks']['constructEvent']
>;

export type StripePaymentIntentObject = Extract<
  StripeEvent,
  { type: 'payment_intent.succeeded' }
>['data']['object'];
