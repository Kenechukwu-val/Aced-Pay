import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.payment.findMany({
      where: { subscription: { tenantId } },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });
  }

  async findBySubscriptionId(subscriptionId: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription  not found`,
      );
    }

    return this.prisma.payment.findMany({
      where: { subscriptionId },
    });
  }

  async findOne(id: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, subscription: { tenantId } },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id '${id}' not found`);
    }

    return payment;
  }

  async create(tenantId: string, data: {
    subscriptionId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    transactionId?: string;
  }) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: data.subscriptionId, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id '${data.subscriptionId}' not found`,
      );
    }

    return this.prisma.payment.create({
      data: {
        subscriptionId: data.subscriptionId,
        amount: data.amount,
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        status: 'succeeded',
        paidAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: string, tenantId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, subscription: { tenantId } },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id '${id}' not found`);
    }

    return this.prisma.payment.update({
      where: { id },
      data: { status },
    });
  }
}
