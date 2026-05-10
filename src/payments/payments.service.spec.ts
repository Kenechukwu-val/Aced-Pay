/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrisma: any = {
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all payments for tenant', async () => {
      const payments = [
        { id: '1', subscriptionId: '1', amount: 5000, status: 'completed' },
      ];
      mockPrisma.payment.findMany.mockResolvedValue(payments);

      const result = await service.findAll('tenant-123');
      expect(result).toEqual(payments);
    });
  });

  describe('findBySubscriptionId', () => {
    it('should return payments for a subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: '1' });
      const payments = [{ id: '1', subscriptionId: '1', amount: 5000 }];
      mockPrisma.payment.findMany.mockResolvedValue(payments);

      const result = await service.findBySubscriptionId('1', 'tenant-123');
      expect(result).toEqual(payments);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const payment = { id: '1', subscriptionId: '1', amount: 5000 };
      mockPrisma.payment.findFirst.mockResolvedValue(payment);

      const result = await service.findOne('1', 'tenant-123');
      expect(result).toEqual(payment);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existing', 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if subscription not found', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-123', { subscriptionId: '1', amount: 5000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a payment', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.payment.create.mockResolvedValue({
        id: '1',
        subscriptionId: '1',
        amount: 5000,
        status: 'succeeded',
      });

      const result = await service.create('tenant-123', {
        subscriptionId: '1',
        amount: 5000,
      });
      expect(result.status).toBe('succeeded');
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existing', 'failed', 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update payment status', async () => {
      mockPrisma.payment.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.payment.update.mockResolvedValue({
        id: '1',
        status: 'failed',
      });

      const result = await service.updateStatus('1', 'failed', 'tenant-123');
      expect(result.status).toBe('failed');
    });
  });
});
