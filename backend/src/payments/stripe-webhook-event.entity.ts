import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('stripe_webhook_events')
export class StripeWebhookEvent {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  processedAt: Date;
}
