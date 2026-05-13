import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TenantContext } from '../common/tenant/tenant-context';
import { RolesGuard } from '../common/guards/roles.guard';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  const mockService = {
    findAll: jest.fn(),
    findBySubscriptionId: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockTenantContext = {
    getTenantId: jest.fn().mockReturnValue('tenant-123'),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        { provide: TenantContext, useValue: mockTenantContext },
      ],
    })
      .overrideProvider(PaymentsService)
      .useValue(mockService)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const payments = [
        { id: '1', subscriptionId: '1', amount: 5000, status: 'completed' },
      ];
      mockService.findAll.mockResolvedValue(payments);

      expect(await controller.findAll()).toEqual(payments);
    });
  });
});
