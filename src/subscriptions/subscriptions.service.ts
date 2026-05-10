import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    // Validate tenant existence
    return this.prisma.subscription.findMany({
      where: { tenantId },
      include: { plan: true },
    });
  }

  async findOne(id: string, tenantId: string) {
    // Validate subscription existence
    const subscription = await this.prisma.subscription.findUnique({
      where: { id, tenantId },
      include: { plan: true, payments: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id '${id}' not found`);
    }
    return subscription;
  }

  async create(tenantId: string, planId: string) {
    // Validate plan existence
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Plan with id '${planId}' not found`);
    }

    // Check for existing active subscription for the tenant
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: { tenantId, status: 'active' },
    });

    if (activeSubscription) {
      throw new BadRequestException(`Tenant already has an active subscription`);
    }

    //Calculate trial period end date (e.g., 14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + plan.trialDays);

    // Calculate current period
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(
      currentPeriodEnd.getMonth() + (plan.interval === 'year' ? 12 : 1)
    );

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId,
        status: 'trailing',
        trialEndDate,
        currentPeriodStart,
        currentPeriodEnd,
        gracePeriodDays: 7,
      },
      include: { plan: true },
    });
  }

  async cancel(id: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id '${id}' not found`);
    }

    return this.prisma.subscription.update({
      where: { id },
      data: { 
        status: 'cancelled', 
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id '${id}' not found`);
    }

    await this.prisma.subscription.delete({
      where: { id },
    });
    return { message: `Subscription deleted successfully` };
  }
}
