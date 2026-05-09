import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;

  const mockService = {
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    cancel: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideProvider(SubscriptionsService)
      .useValue(mockService)
      .compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all subscriptions', async () => {
      const subscriptions = [
        { id: '1', userId: '1', planId: '1', status: 'active' },
      ];
      mockService.findAll.mockResolvedValue(subscriptions);

      expect(await controller.findAll()).toEqual(subscriptions);
    });
  });
});
