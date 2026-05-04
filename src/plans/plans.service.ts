import { Injectable } from '@nestjs/common';

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
}
