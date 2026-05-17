import { Injectable } from '@nestjs/common';
import { Paystack } from 'paystack-sdk';

@Injectable()
export class PaystackService {
    private paystack: Paystack;

    constructor() {
        const secretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!secretKey) {
            throw new Error('PAYSTACK_SECRET_KEY not set');
        }
        this.paystack = new Paystack(secretKey);
    }

    // Create a Paystack customer
    async createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
        const params: any = { email };

        if (name) {
            const parts = name.split(' ');
            params.first_name = parts[0];
            if (parts.length > 1) {
                params.last_name = parts.slice(1).join(' ');
            }
        }

        if (metadata) {
            params.metadata = metadata;
        }

        const response = await this.paystack.customer.create(params);
        if (!response.status) {
            throw new Error(response.message || 'Failed to create customer');
        }

        const data = response.data;
        if (!data) {
            throw new Error('No customer data returned from Paystack');
        }

        return {
            id: response.data.id,
            email: response.data.email,
            customerCode: response.data.customer_code,
        };
    }

    // Get customer by ID or code
    async getCustomer(customerCode: string): Promise<{ id: string; email: string; customerCode: string }> {
        const response = await this.paystack.customer.fetch(customerCode) as any;
        
        if (!response.status) {
            throw new Error(response.message || 'Failed to fetch customer');
        }

        return {
            id: response.data.id,
            email: response.data.email,
            customerCode: response.data.customer_code,
        };
    }

    // Create checkout session
    async createCheckoutSession(
        customerEmailOrCode: string,
        planCode: string,
        successUrl: string,
    ): Promise<{ id: string; url: string; reference: string }> {
        const response = await this.paystack.transaction.initialize({
            email: customerEmailOrCode,
            plan: planCode,
            amount: 0,
            callback_url: successUrl,
        } as any);
        
        if (!response.status) {
            throw new Error(response.message || 'Failed to create checkout session');
        }

        const data = response.data;
        if (!data) {
            throw new Error('No transaction data returned from Paystack');
        }

        return {
            id: response.data.reference,
            url: response.data.authorization_url,
            reference: response.data.reference,
        };
    }

    // Create customer portal session (manage subscriptions)
    async createCustomerPortalSession(customerCode: string, returnUrl: string): Promise<{ url: string }> {
        // Direct to Paystack customer page where they can manage payment methods
        return {
            url: `https://dashboard.paystack.com/customers/${customerCode}`
        };
    }

    // Verify transaction (for checkout completion)
    async verifyTransaction(reference: string): Promise<any> {
        const response = await this.paystack.transaction.verify(reference) as any;

        // Log full response for debugging
        console.log('Paystack verify response:', JSON.stringify(response));

        if (!response.status) {
            const errorMsg = response.message || 'Failed to verify transaction';
            console.error('Paystack verify error:', errorMsg);
            throw new Error(errorMsg);
        }

        return response.data;
    }

    // Cancel a subscription
    async disableSubscription(subscriptionCode: string): Promise<{ status: string }> {
        const response = await this.paystack.subscription.disable({
            code: subscriptionCode,
            token: subscriptionCode,
        }) as any;

        if (!response.status) {
            throw new Error(response.message || 'Failed to disable subscription');
        }

        return {
            status: response.data.status,
        };
    }

    // Get subscription
    async getSubscription(subscriptionId: string): Promise<any> {
        const response = await this.paystack.subscription.fetch(subscriptionId) as any;

        if (!response.status) {
            throw new Error(response.message || 'Failed to fetch subscription details');
        }

        return response.data;
    }

    // Verify webhook signature
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const hash = require('crypto')
            .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');
        return hash === signature;
    }

    // Create a plan in Paystack
    async createPlan(
        name: string,
        amount: number,
        interval: 'daily' | 'weekly' | 'monthly' | 'annually',
        description?: string,
    ): Promise<{ planCode: string; name: string; amount: number; interval: string }> {
        const response = await this.paystack.plan.create({
            name,
            amount: amount * 100, // Paystack uses kobo
            interval,
            description,
        }) as any;

        if (!response.status) {
            throw new Error(response.message || 'Failed to create Paystack plan');
        }

        return {
            planCode: response.data.plan_code,
            name: response.data.name,
            amount: response.data.amount,
            interval: response.data.interval,
        };
    }

    // Get a plan from Paystack
    async getPlan(planCode: string): Promise<any> {
        const response = await this.paystack.plan.fetch(planCode) as any;

        if (!response.status) {
            throw new Error(response.message || 'Failed to fetch Paystack plan');
        }

        return response.data;
    }
}
