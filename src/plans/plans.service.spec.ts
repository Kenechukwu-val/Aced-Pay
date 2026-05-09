/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PlansService', () => {
  let service: PlansService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: any;

  const mockPrisma: any = {
    plan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all plans', async () => {
      const plans = [
        { id: '1', name: 'Basic', price: 5000, interval: 'month' },
        { id: '2', name: 'Pro', price: 15000, interval: 'month' },
      ];
      mockPrisma.plan.findMany.mockResolvedValue(plans);

      const result = await service.findAll();
      expect(result).toEqual(plans);
    });
  });

  describe('findOne', () => {
    it('should return a plan by id', async () => {
      const plan = { id: '1', name: 'Basic', price: 5000, interval: 'month' };
      mockPrisma.plan.findUnique.mockResolvedValue(plan);

      const result = await service.findOne('1');
      expect(result).toEqual(plan);
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new plan', async () => {
      const planData = { name: 'Premium', price: 25000, interval: 'month' };
      const createdPlan = { id: '1', ...planData };
      mockPrisma.plan.findUnique.mockResolvedValue(null);
      mockPrisma.plan.create.mockResolvedValue(createdPlan);

      const result = await service.create(planData as any);
      expect(result).toEqual(createdPlan);
    });

    it('should throw ConflictException if plan name exists', async () => {
      const planData = { name: 'Basic', price: 5000, interval: 'month' };
      mockPrisma.plan.findUnique.mockResolvedValue({ id: '1', name: 'Basic' });

      await expect(service.create(planData as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
