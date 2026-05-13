import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantContext } from '../common/tenant/tenant-context';
import { RolesGuard } from '../common/guards/roles.guard';

describe('TenantsController', () => {
  let controller: TenantsController;

  const mockService = {
    findAllForUser: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    inviteMember: jest.fn(),
    removeMember: jest.fn(),
  };

  const mockTenantContext = {
    getUserId: jest.fn().mockReturnValue('user-123'),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        { provide: TenantsService, useValue: mockService },
        { provide: TenantContext, useValue: mockTenantContext },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tenants for user', async () => {
      const tenants = [{ id: '1', name: 'Test' }];
      mockService.findAllForUser.mockResolvedValue(tenants);

      expect(await controller.findAll()).toEqual(tenants);
    });
  });
});
