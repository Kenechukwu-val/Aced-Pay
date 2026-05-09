import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        subscription: {
          include: { user: true, plan: true },
        },
      },
    });
  }

  async findBySubscriptionId(subscriptionId: string) {
    return this.prisma.payment.findMany({
      where: { subscriptionId },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        subscription: {
          include: { user: true, plan: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id '${id}' not found`);
    }

    return payment;
  }

  async create(data: {
    subscriptionId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    transactionId?: string;
  }) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: data.subscriptionId },
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
        status: 'completed',
        paidAt: new Date(),
      },
    });
  }

  async updateStatus(id: string, status: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
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
