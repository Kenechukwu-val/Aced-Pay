import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.subscription.findMany({
      where: { tenantId },
      include: { plan: true },
    });
  }

  async findOne(id: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, tenantId },
      include: { plan: true, payments: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id '${id}' not found`);
    }
    return subscription;
  }

  async createCheckoutSession(tenantId: string, planId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { members: { where: { role: 'owner' }, include: { user: true } } },
    });

    if (!tenant || !tenant.members[0]) {
      throw new NotFoundException('Tenant or owner not found');
    }

    const owner = tenant.members[0].user;
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Get or create Stripe customer
    let subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { tenant: true },
    });

    let customerId: string;

    if (subscription?.externalCustomerId) {
      customerId = subscription.externalCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await this.stripeService.createCustomer(
        owner.email,
        owner.name || undefined,
        { tenantId, ownerId: owner.id },
      );
      customerId = customer.id;
    }

    // Get the Stripe price ID from plan 
    const stripePriceId = plan.features; 

    if (!stripePriceId) {
      throw new BadRequestException('Plan is not configured for Stripe billing');
    }

    // Create checkout session
    const session = await this.stripeService.createCheckoutSession(
      customerId,
      stripePriceId,
      `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.FRONTEND_URL}/subscription/canceled`,
    );

    return { sessionId: session.id, url: session.url };
  }

  async handleCheckoutComplete(tenantId: string, sessionId: string) {
    const session = await this.stripeService.instance.checkout.sessions.retrieve(sessionId);

    if (!session.subscription) {
      throw new BadRequestException('No subscription in session');
    }

    const stripeSubscription = await this.stripeService.getSubscription(session.subscription as string);

    // Update subscription in database
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (subscription) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          externalId: stripeSubscription.id,
          externalCustomerId: session.customer as string,
          status: 'active',
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        },
      });
    }

    throw new NotFoundException('No subscription found for tenant');
  }

  async createPortalSession(tenantId: string, returnUrl: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!subscription?.externalCustomerId) {
      throw new NotFoundException('No active subscription found');
    }

    const session = await this.stripeService.createCustomerPortalSession(
      subscription.externalCustomerId,
      returnUrl,
    );

    return { url: session.url };
  }

  async cancel(tenantId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id '${id}' not found`);
    }

    // Cancel at period end in Stripe
    if (subscription.externalId) {
      await this.stripeService.cancelSubscriptionAtPeriodEnd(subscription.externalId);
    }

    // Update database
    return this.prisma.subscription.update({
      where: { id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
      },
    });
  }

  // Called by webhook when payment succeeds
  async handlePaymentSucceeded(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { externalId: subscriptionId },
    });

    if (subscription) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'active' },
      });
    }
  }

  // Called by webhook when payment fails
  async handlePaymentFailed(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { externalId: subscriptionId },
    });

    if (subscription) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'past_due' },
      });
    }
  }

  async create(tenantId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with id '${planId}' not found`);
    }

    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { tenantId, status: { in: ['trialing', 'active', 'past_due'] } },
    });

    if (existingSubscription) {
      throw new BadRequestException('Tenant already has an active subscription');
    }

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(
      currentPeriodEnd.getMonth() + (plan.interval === 'year' ? 12 : 1)
    );

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId,
        status: 'trialing',
        trialEndDate,
        currentPeriodStart,
        currentPeriodEnd,
        gracePeriodDays: 7,
      },
      include: { plan: true },
    });
  }


  async delete(id: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id '${id}' not found`);
    }

    await this.prisma.subscription.delete({ where: { id } });
    return { message: 'Subscription deleted successfully' };
  }
}
