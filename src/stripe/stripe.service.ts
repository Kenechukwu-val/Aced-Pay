import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: any;

    constructor() {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not set');
        }
        this.stripe = new Stripe(secretKey, {
            apiVersion: '2026-04-22.dahlia',
        });
    }

    get instance(): any {
        return this.stripe;
    }

    // Create a Stripe customer for a tenant
    async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
        return this.stripe.customers.create({
            email,
            name: name || undefined,
            metadata,
        });
    }

    // Create a subscription checkout session
    async createCheckoutSession(
        customerId: string,
        priceId: string,
        successUrl: string,
        cancelUrl: string,
    ) {
        return this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
        })
    }

    // Create a customer portal session (for managing subscriptions)
    async createCustomerPortalSession(customerId: string, returnUrl: string) {
        return this.stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        })
    }

    // Cancel subscription at period end
    async cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
        return this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }

    // Cancel subscription immediately
    async cancelSubscriptionImmediately(subscriptionId: string) {
        return this.stripe.subscriptions.cancel(subscriptionId);
    }

    // Get subscription details
    async getSubscription(subscriptionId: string) {
        return this.stripe.subscriptions.retrieve(subscriptionId);
    }

    // List all subscriptions for a customer
    async listSubscriptions(customerId: string) {
        return this.stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
        });
    }

    // Construct webhook event
    constructEvent(payload: string | Buffer, signature: string, webhookSecret: string) {
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }

}
