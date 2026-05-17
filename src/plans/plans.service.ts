import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './create-plan.dto';
import { PaystackService } from '../paystack/paystack.service';

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
  ) {}

  async findAll() {
    return this.prisma.plan.findMany();
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException(`Plan with id ${id} not found`);
    }
    return plan;
  }

  async create(createPlanDto: CreatePlanDto) {
    const existingPlan = await this.prisma.plan.findUnique({
      where: { name: createPlanDto.name },
    });

    if (existingPlan) {
      throw new ConflictException(
        `Plan with name '${createPlanDto.name}' already exists`,
      );
    }

    // Map interval to Paystack format
    const intervalMap: { [key: string]: 'daily' | 'weekly' | 'monthly' | 'annually' } = {
      'day': 'daily',
      'week': 'weekly',
      'month': 'monthly',
      'year': 'annually',
    };
    const paystackInterval = intervalMap[createPlanDto.interval] || 'monthly';

    // Create plan in Paystack
    const paystackPlan = await this.paystackService.createPlan(
      createPlanDto.name,
      createPlanDto.price,
      paystackInterval,
      `Plan: ${createPlanDto.name}`,
    );

    // Create plan in database with Paystack plan code
    return this.prisma.plan.create({
      data: {
        ...createPlanDto,
        paystackPlanCode: paystackPlan.planCode,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      price?: number;
      interval?: string;
      description?: string;
      features?: string;
    },
  ) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id '${id}' not found`);
    }
    if (data.name && data.name !== plan.name) {
      const existingPlan = await this.prisma.plan.findUnique({
        where: { name: data.name },
      });
      if (existingPlan) {
        throw new ConflictException(
          `Plan with name '${data.name}' already exists`,
        );
      }
    }
    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id '${id}' not found`);
    }
    await this.prisma.plan.delete({
      where: { id },
    });
    return { message: `Plan deleted successfully` };
  }
}
