import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { TenantContext } from '../tenant/tenant-context';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let tenantContext: TenantContext;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockTenantContext = {
    getRole: jest.fn(),
  };

  const mockExecutionContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: TenantContext, useValue: mockTenantContext },
      ],
    }).compile();

        guard = module.get<RolesGuard>(RolesGuard);
        reflector = module.get<Reflector>(Reflector);
        tenantContext = module.get<TenantContext>(TenantContext);
    });

    // Test 1: No roles required → allow
    it('should allow access when no roles are required', () => {
        mockReflector.getAllAndOverride.mockReturnValue(undefined);
        const result = guard.canActivate(mockExecutionContext as any);
        expect(result).toBe(true);
    });

    // Test 2: User has required role → allow
    it('should allow access when user has required role', () => {
        mockReflector.getAllAndOverride.mockReturnValue(['admin']);
        mockTenantContext.getRole.mockReturnValue('admin');
        const result = guard.canActivate(mockExecutionContext as any);
        expect(result).toBe(true);
    });

    // Test 3: User lacks required role → deny
    it('should deny access when user lacks required role', () => {
        mockReflector.getAllAndOverride.mockReturnValue(['owner']);
        mockTenantContext.getRole.mockReturnValue('member');
        const result = guard.canActivate(mockExecutionContext as any);
        expect(result).toBe(false);
    });

    // Test 4: Multiple roles - user has one → allow
    it('should allow access when user has one of multiple roles', () => {
        mockReflector.getAllAndOverride.mockReturnValue(['admin', 'owner']);
        mockTenantContext.getRole.mockReturnValue('admin');
        const result = guard.canActivate(mockExecutionContext as any);
        expect(result).toBe(true);
    });
});
