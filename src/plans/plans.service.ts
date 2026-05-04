import { Injectable, NotFoundException } from '@nestjs/common';

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
    return this.plans;
  }

  findOne(id: string): Plan {
    const plan = this.plans.find((p) => p.id === id);

    if (!plan) {
      throw new NotFoundException(`Plan with id '${id}' not found`);
    }

    return plan;
  }
}
