/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: any;

  const mockPrisma: any = {
    subscription: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all subscriptions', async () => {
      const subscriptions = [
        { id: '1', userId: '1', planId: '1', status: 'active' },
      ];
      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);

      const result = await service.findAll();
      expect(result).toEqual(subscriptions);
    });
  });

  describe('findByUser', () => {
    it('should return subscriptions for a user', async () => {
      const subscriptions = [
        { id: '1', userId: '1', planId: '1', status: 'active' },
      ];
      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);

      const result = await service.findByUserId('1');
      expect(result).toEqual(subscriptions);
    });
  });

  describe('findOne', () => {
    it('should return a subscription by id', async () => {
      const subscription = {
        id: '1',
        userId: '1',
        planId: '1',
        status: 'active',
      };
      mockPrisma.subscription.findUnique.mockResolvedValue(subscription);

      const result = await service.findOne('1');
      expect(result).toEqual(subscription);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create('user-1', 'plan-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user has active subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.plan.findUnique.mockResolvedValue({
        id: '1',
        interval: 'month',
      });
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: '1' });

      await expect(service.create('user-1', 'plan-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create a subscription', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.plan.findUnique.mockResolvedValue({
        id: '1',
        interval: 'month',
      });
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscription.create.mockResolvedValue({
        id: '1',
        userId: 'user-1',
        planId: 'plan-1',
        status: 'active',
      });

      const result = await service.create('user-1', 'plan-1');
      expect(result.status).toBe('active');
    });
  });

  describe('cancel', () => {
    it('should throw NotFoundException if subscription not found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      await expect(service.cancel('non-existing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should cancel a subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.subscription.update.mockResolvedValue({
        id: '1',
        status: 'cancelled',
      });

      const result = await service.cancel('1');
      expect(result.status).toBe('cancelled');
    });
  });
});
