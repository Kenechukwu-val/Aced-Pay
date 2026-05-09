import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        // Validate subscriptions existence
        return this.prisma.subscription.findMany({
            include: { user: true, plan: true },
        });
    }

    async findByUserId(userId: string) {
        // Validate user existence
        return this.prisma.subscription.findMany({
            where: { userId },
            include: { plan: true, payment: true },
        });
    }

    async findOne(id: string) {
        // Validate subscription existence
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
            include: { user: true, plan: true, payment: true },
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with id '${id}' not found`);
        }
        return subscription;
    }

    async create(userId: string, planId: string) {
        // Validate user and plan existence
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`User with id '${userId}' not found`);
        }

        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            throw new NotFoundException(`Plan with id '${planId}' not found`);
        }

        const activeSubscription = await this.prisma.subscription.findFirst({
            where: { userId, status: 'active' },
        });

        if (activeSubscription) {
            throw new BadRequestException(`User already has an active subscription`);
        }

        // Calculate end date based on plan interval
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (plan.interval === 'year' ? 12 : 1));

        return this.prisma.subscription.create({
            data: {
                userId,
                planId,
                status: 'active',
                startDate: new Date(),
                endDate,
            },
            include: { plan: true },
        });
    }

    async cancel(id: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
        });

        if (!subscription) {
            throw new NotFoundException(`Subscription with id '${id}' not found`);
        }

        return this.prisma.subscription.update({
            where: { id },
            data: { status: 'cancelled' },
        });
    }

    async delete(id: string) {
        const subscription = await this.prisma.subscription.findUnique({
            where: { id },
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
