import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe.webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsModule } from '../payments/payments.module';
import { StripeModule } from '../stripe/stripe.module';

@Module({
  imports: [SubscriptionsModule, PaymentsModule, StripeModule],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}