import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from './tenant-context';

interface AuthenticatedUser {
  tenantId?: string;
  userId?: string;
  role?: string;
  id?: string;
}

interface RequestWithTenant extends Request {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContext) {}

  use(req: RequestWithTenant, res: Response, next: NextFunction) {
    const user = req.user as AuthenticatedUser | undefined;

    if (user) {
      req.tenantId = user.tenantId;
      req.userId = user.userId || user.id;
      req.userRole = user.role;

      this.tenantContext.set(
        user.tenantId || '',
        user.userId || user.id || '',
        user.role || 'member',
      );
    }
    next();
  }
}
