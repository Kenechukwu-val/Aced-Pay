import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../paystack/paystack.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
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

    const planCode = plan.paystackPlanCode;
    if (!planCode) {
      throw new BadRequestException('Plan is not configured for Paystack');
    }

    // Get or create Paystack customer
    let subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      include: { tenant: true },
    });

    if (subscription?.externalCustomerId) {
      // Customer already exists, use their email
      const customer = await this.paystackService.getCustomer(subscription.externalCustomerId);
      // Use email for checkout
      const session = await this.paystackService.createCheckoutSession(
        customer.email,
        planCode,
        `${process.env.FRONTEND_URL}/subscription/success?reference={REFERENCE}`,
      );

      return { sessionId: session.reference, url: session.url };
    } else {
      // Create new Paystack customer
      const customer = await this.paystackService.createCustomer(
        owner.email,
        owner.name || undefined,
        { tenantId, ownerId: owner.id },
      );

      // Create checkout session with customer code
      const session = await this.paystackService.createCheckoutSession(
        customer.customerCode,
        planCode,
        `${process.env.FRONTEND_URL}/subscription/success?reference={REFERENCE}`,
      );

      return { sessionId: session.reference, url: session.url };
    }
  }

  async handleCheckoutComplete(tenantId: string, reference: string) {
    // Verify the transaction with Paystack
    const transaction = await this.paystackService.verifyTransaction(reference);

    if (transaction.status !== 'success') {
      throw new BadRequestException('Payment not successful');
    }

    // Get subscription from transaction metadata
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (subscription) {
      return this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          externalId: transaction.subscription_id || transaction.id,
          externalCustomerId: transaction.customer?.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });
    }

    // Create new subscription if none exists
    const plan = await this.prisma.plan.findFirst();
    if (!plan) {
      throw new NotFoundException('No plan found. Please create a plan first.');
    }

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: 'active',
        externalId: (transaction as any).subscription_id || transaction.id,
        externalCustomerId: (transaction as any).customer?.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: { plan: true },
    });
  }

  async createPortalSession(tenantId: string, returnUrl: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
    });

    if (!subscription?.externalCustomerId) {
      throw new NotFoundException('No active subscription found');
    }

    const session = await this.paystackService.createCustomerPortalSession(
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

    // Cancel in Paystack
    if (subscription.externalId) {
      await this.paystackService.disableSubscription(subscription.externalId);
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
    // Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with id '${tenantId}' not found`);
    }

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
