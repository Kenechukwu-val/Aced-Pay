/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PlansController', () => {
  let controller: PlansController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: PlansService;

  const mockService: any = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlansController],
      providers: [PlansService, { provide: PrismaService, useValue: {} }],
    })
      .overrideProvider(PlansService)
      .useValue(mockService)
      .compile();

    controller = module.get<PlansController>(PlansController);
    service = module.get<PlansService>(PlansService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all plans', async () => {
      const plans = [
        { id: '1', name: 'Basic', price: 5000, interval: 'month' },
      ];
      mockService.findAll.mockResolvedValue(plans);

      expect(await controller.findAll()).toEqual(plans);
    });
  });

  describe('findOne', () => {
    it('should return a plan by id', async () => {
      const plan = { id: '1', name: 'Pro', price: 15000, interval: 'month' };
      mockService.findOne.mockResolvedValue(plan);

      expect(await controller.findOne('1')).toEqual(plan);
    });

    it('should throw NotFoundException for non-existing plan', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('non-existing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new plan', async () => {
      const planData = { name: 'Premium', price: 25000, interval: 'month' };
      const createdPlan = { id: '1', ...planData };
      mockService.create.mockResolvedValue(createdPlan);

      expect(await controller.create(planData as any)).toEqual(createdPlan);
    });
  });
});
