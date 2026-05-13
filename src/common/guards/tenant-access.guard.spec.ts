import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TenantAccessGuard } from './tenant-access.guard';
import { TenantContext } from '../tenant/tenant-context';

describe('TenantAccessGuard', () => {

    let guard: TenantAccessGuard;
    let tenantContext: TenantContext;

    const mockTenantContext = {
        getTenantId: jest.fn(),
    };

    const mockExecutionContext = () => {
        return {
        switchToHttp: () => ({
            getRequest: () => ({
            params: {},
            }),
        }),
        };
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            TenantAccessGuard,
            { provide: TenantContext, useValue: mockTenantContext },
        ],
        }).compile();

        guard = module.get<TenantAccessGuard>(TenantAccessGuard);
        tenantContext = module.get<TenantContext>(TenantContext);
    });

    // Test 1: No tenant context → deny
    it('should deny access when no tenant context', () => {
        mockTenantContext.getTenantId.mockReturnValue(undefined);
        const context = mockExecutionContext();
        expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });

    // Test 2: Tenant context exists, no route param → allow
    it('should allow access when tenant context exists but no route param', () => {
        mockTenantContext.getTenantId.mockReturnValue('tenant-123');
        const context = mockExecutionContext();
        const result = guard.canActivate(context as any);
        expect(result).toBe(true);
    });

    // Test 3: Route param matches current tenant → allow
    it('should allow access when route param matches tenant context', () => {
        mockTenantContext.getTenantId.mockReturnValue('tenant-123');
        const context = mockExecutionContext();
        context.switchToHttp().getRequest = () => ({ params: { id: 'tenant-123' } });
        const result = guard.canActivate(context as any);
        expect(result).toBe(true);
    });

    // Test 4: Route param doesn't match current tenant → deny
    it('should deny access when route param does not match tenant context', () => {
        mockTenantContext.getTenantId.mockReturnValue('tenant-123');
        const context = mockExecutionContext();
        context.switchToHttp().getRequest = () => ({ params: { id: 'tenant-456' } });
        expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });

    // Test 5: Route param with 'tenantId' key
    it('should allow access when tenantId param matches', () => {
        mockTenantContext.getTenantId.mockReturnValue('tenant-123');
        const context = mockExecutionContext();
        context.switchToHttp().getRequest = () => ({ params: { tenantId: 'tenant-123' } });
        const result = guard.canActivate(context as any);
        expect(result).toBe(true);
    });
});
