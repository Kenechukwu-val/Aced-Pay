import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { TenantContext } from '../common/tenant/tenant-context';
import { RolesGuard } from '../common/guards/roles.guard';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    cancel: jest.fn(),
    delete: jest.fn(),
  };

  const mockTenantContext = {
    getTenantId: jest.fn().mockReturnValue('tenant-123'),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        SubscriptionsService,
        { provide: TenantContext, useValue: mockTenantContext },
      ],
    })
      .overrideProvider(SubscriptionsService)
      .useValue(mockService)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all subscriptions', async () => {
      const subscriptions = [
        { id: '1', tenantId: 'tenant-123', planId: '1', status: 'active' },
      ];
      mockService.findAll.mockResolvedValue(subscriptions);

      expect(await controller.findAll()).toEqual(subscriptions);
    });
  });
});
