import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PaymentsModule } from '../payments/payments.module';


@Module({
  imports: [SubscriptionsModule, PaymentsModule],
  controllers: [],
})
export class WebhooksModule {}