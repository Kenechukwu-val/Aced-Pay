import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant-context';

@Injectable()
export class TenantAccessGuard implements CanActivate {
    constructor(private tenantContext: TenantContext) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        
        // Extract tenantId from route parameters (assuming it's named 'tenantId' or 'id')
        const paramTenantId = request.params.tenantId || request.params.id; 

        // If no tenant context, deny access
        const currentTenantId = this.tenantContext.getTenantId();
        if (!currentTenantId) {
            throw new ForbiddenException('No tenant context');
        }

        // If accessing a specific tenant, verify access
        if (paramTenantId && paramTenantId !== currentTenantId) {
            throw new ForbiddenException('Access denied to this tenant');
        }

        return true; // Access granted
    }
}