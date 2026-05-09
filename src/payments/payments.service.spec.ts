/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: any;

  const mockPrisma: any = {
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
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
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const payments = [
        { id: '1', subscriptionId: '1', amount: 5000, status: 'completed' },
      ];
      mockPrisma.payment.findMany.mockResolvedValue(payments);

      const result = await service.findAll();
      expect(result).toEqual(payments);
    });
  });

  describe('findBySubscriptionId', () => {
    it('should return payments for a subscription', async () => {
      const payments = [{ id: '1', subscriptionId: '1', amount: 5000 }];
      mockPrisma.payment.findMany.mockResolvedValue(payments);

      const result = await service.findBySubscriptionId('1');
      expect(result).toEqual(payments);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      const payment = { id: '1', subscriptionId: '1', amount: 5000 };
      mockPrisma.payment.findUnique.mockResolvedValue(payment);

      const result = await service.findOne('1');
      expect(result).toEqual(payment);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should throw NotFoundException if subscription not found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ subscriptionId: '1', amount: 5000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a payment', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.payment.create.mockResolvedValue({
        id: '1',
        subscriptionId: '1',
        amount: 5000,
        status: 'completed',
      });

      const result = await service.create({
        subscriptionId: '1',
        amount: 5000,
      });
      expect(result.status).toBe('completed');
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('non-existing', 'failed'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update payment status', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.payment.update.mockResolvedValue({
        id: '1',
        status: 'failed',
      });

      const result = await service.updateStatus('1', 'failed');
      expect(result.status).toBe('failed');
    });
  });
});
