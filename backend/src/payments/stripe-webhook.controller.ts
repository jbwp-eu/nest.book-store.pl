import {

  Controller,

  Headers,

  Logger,

  Post,

  Req,

  Res,

} from '@nestjs/common';

import type { RawBodyRequest } from '@nestjs/common';

import type { Request, Response } from 'express';

import { PaymentsService } from './payments.service';

import { StripeService } from './stripe.service';



@Controller('webhooks')

export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly paymentsService: PaymentsService,
  ) {}



  @Post('stripe')

  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response,
  ) {
    const event = this.stripeService.constructEvent(
      req.rawBody as Buffer,
      signature,
    );

    this.logger.log(
      `stripe webhook received: ${event.id} (${event.type})`,
    );

    const isFirstDelivery = await this.paymentsService.tryRecordStripeEvent(
      event.id,
    );

    if (!isFirstDelivery) {
      this.logger.log(`stripe webhook duplicate skipped: ${event.id}`);
      return res.status(200).json({ received: true });
    }

    try {
      const result = await this.paymentsService.applyStripeWebhookEvent(event);
      return res.status(200).json(result);
    } catch (err) {
      this.logger.error(
        `stripe webhook handler failed for ${event.id}`,
        err instanceof Error ? err.stack : err,
      );

      return res.status(200).json({ received: true });

    }

  }

}


