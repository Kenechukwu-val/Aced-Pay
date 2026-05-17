import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PaystackService } from '../paystack/paystack.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('webhooks/paystack')
export class PaystackWebhookController {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
  ) {
    // Skip signature verification in development for easier testing
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && signature === 'test-signature') {
      // Allow test requests in development
    } else {
      // Verify webhook signature in production
      const isValid = this.paystackService.verifyWebhookSignature(
        JSON.stringify(body),
        signature,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const event = body;

    // Handle the event
    switch (event.event) {
      // Payment successful
      case 'charge.success': {
        const transaction = event.data;
        const reference = transaction.reference;

        if (reference) {
          try {
            // Skip verification in development for test references
            const isDev = process.env.NODE_ENV !== 'production';
            let verifiedTransaction;

            if (isDev && reference.startsWith('test')) {
              // Mock response for test references in development
              console.log('Development mode: skipping real verification');
              verifiedTransaction = {
                status: 'success',
                reference: reference,
                amount: transaction.amount || 15000,
                currency: transaction.currency || 'NGN',
                customer: { email: transaction.customer?.email || 'test@example.com' },
                subscription: null,
              };
            } else {
              console.log('Verifying transaction with reference:', reference);
              verifiedTransaction = await this.paystackService.verifyTransaction(reference);
            }
            console.log('Verified transaction:', verifiedTransaction);

            // Check if this is a subscription payment or one-time
            if (verifiedTransaction.subscription) {
              // Handle as subscription payment
              await this.subscriptionsService.handlePaymentSucceeded(
                verifiedTransaction.subscription.subscription_code,
              );

              // Create payment record
              await this.paymentsService.createFromPaystackWebhook(
                verifiedTransaction.subscription.subscription_code,
                {
                  amount: verifiedTransaction.amount,
                  currency: verifiedTransaction.currency,
                  transactionId: verifiedTransaction.reference,
                  paymentMethod: verifiedTransaction.channel || 'card',
                },
              );
            }
          } catch (error) {
            console.error('Error verifying transaction:', error);
          }
        }
        break;
      }

      // Subscription enabled/activated
      case 'subscription.created':
      case 'subscription.enabled': {
        const subscription = event.data;
        
        if (subscription.subscription_code) {
          await this.subscriptionsService.handlePaymentSucceeded(
            subscription.subscription_code,
          );
        }
        break;
      }

      // Subscription disabled/canceled
      case 'subscription.disabled':
      case 'subscription.canceled': {
        const subscription = event.data;
        
        if (subscription.subscription_code) {
          await this.subscriptionsService.handlePaymentFailed(
            subscription.subscription_code,
          );
        }
        break;
      }

      // Invoice created (for recurring payments)
      case 'invoice.created': {
        const invoice = event.data;
        console.log('Invoice created:', invoice.id);
        break;
      }

      // Invoice paid
      case 'invoice.paid': {
        const invoice = event.data;
        
        // Create payment record
        if (invoice.subscription?.subscription_code) {
          await this.paymentsService.createFromPaystackWebhook(
            invoice.subscription.subscription_code,
            {
              amount: invoice.amount,
              currency: invoice.currency,
              transactionId: invoice.id,
              paymentMethod: 'card',
            },
          );
        }
        break;
      }

      // Invoice failed
      case 'invoice.failed': {
        const invoice = event.data;
        
        if (invoice.subscription?.subscription_code) {
          await this.subscriptionsService.handlePaymentFailed(
            invoice.subscription.subscription_code,
          );
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    return { received: true };
  }
}
