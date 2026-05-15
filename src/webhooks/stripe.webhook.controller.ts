import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  // No auth guard - Stripe signature verification handles authentication
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Body() body: any,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    let event;

    try {
      event = this.stripeService.instance.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tenantId = session.client_reference_id || session.metadata?.tenantId;
        
        if (tenantId) {
          await this.subscriptionsService.handleCheckoutComplete(tenantId, session.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        if (subscription.status === 'active') {
          await this.subscriptionsService.handlePaymentSucceeded(subscription.id);
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          await this.subscriptionsService.handlePaymentFailed(subscription.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await this.subscriptionsService.handlePaymentFailed(subscription.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await this.subscriptionsService.handlePaymentSucceeded(subscriptionId);

          // Create payment record from Stripe invoice
          await this.paymentsService.createFromStripeWebhook(subscriptionId, {
            amount: invoice.amount_paid,
            currency: invoice.currency,
            transactionId: invoice.id,
            paymentMethod: invoice.payment_intent ? 'card' : undefined,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;
        
        if (subscriptionId) {
          await this.subscriptionsService.handlePaymentFailed(subscriptionId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }
}
