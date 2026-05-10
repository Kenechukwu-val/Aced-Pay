/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  const mockPrisma: any = {
    subscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all subscriptions for tenant', async () => {
      const subscriptions = [
        { id: '1', tenantId: 'tenant-123', planId: '1', status: 'active' },
      ];
      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);

      const result = await service.findAll('tenant-123');
      expect(result).toEqual(subscriptions);
    });
  });

  describe('findOne', () => {
    it('should return a subscription by id', async () => {
      const subscription = {
        id: '1',
        tenantId: 'tenant-123',
        planId: '1',
        status: 'active',
      };
      mockPrisma.subscription.findFirst.mockResolvedValue(subscription);

      const result = await service.findOne('1', 'tenant-123');
      expect(result).toEqual(subscription);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existing', 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if plan not found', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue(null);

      await expect(service.create('tenant-123', 'plan-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if tenant has active subscription', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue({
        id: '1',
        interval: 'month',
        trialDays: 14,
      });
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: '1' });

      await expect(service.create('tenant-123', 'plan-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a subscription with trial', async () => {
      mockPrisma.plan.findUnique.mockResolvedValue({
        id: '1',
        interval: 'month',
        trialDays: 14,
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscription.create.mockResolvedValue({
        id: '1',
        tenantId: 'tenant-123',
        planId: 'plan-1',
        status: 'trialing',
      });

      const result = await service.create('tenant-123', 'plan-1');
      expect(result.status).toBe('trialing');
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundException if subscription not found', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(service.cancel('non-existing', 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should cancel a subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.subscription.update.mockResolvedValue({
        id: '1',
        status: 'canceled',
      });

      const result = await service.cancel('1', 'tenant-123');
      expect(result.status).toBe('canceled');
    });
  });
});
