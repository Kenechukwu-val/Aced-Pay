import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePlanDto } from './create-plan.dto';

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
};

@Injectable()
export class PlansService {
  private readonly plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 5000,
      interval: 'month',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 15000,
      interval: 'month',
    },
  ];

  findAll(): Plan[] {
    // Returns all plans
    return this.plans;
  }

  findOne(id: string): Plan {
    // Finds a plan by id and throws NotFoundException if not found
    const plan = this.plans.find((p) => p.id === id);

    if (!plan) {
      throw new NotFoundException(`Plan with id '${id}' not found`);
    }

    return plan;
  }

  create(createPlanDto: CreatePlanDto): Plan {
    // Creates a new plan and throws ConflictException if a plan with the same id already exists
    const existingPlan = this.plans.find((p) => p.id === createPlanDto.id);

    if (existingPlan) {
      throw new ConflictException(
        `Plan with id '${createPlanDto.id}' already exists`,
      );
    }

    this.plans.push(createPlanDto);
    return createPlanDto;
  }
}
