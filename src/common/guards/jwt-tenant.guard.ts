import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantContext } from '../tenant/tenant-context';

@Injectable()
export class JwtTenantGuard extends AuthGuard('jwt') {
  constructor(private tenantContext: TenantContext) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.id) {
      this.tenantContext.set(
        user.tenantId || '',
        user.userId || user.id || '',
        user.role || 'member',
      );
    }

    return true;
  }
}