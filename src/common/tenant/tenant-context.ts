import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantContext {
  private tenantId: string | undefined;
  private userId: string | undefined;
  private role: string | undefined;

  set(tenantId: string, userId: string, role: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.role = role;
  }

  getTenantId(): string | undefined {
    return this.tenantId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getRole(): string | undefined {
    return this.role;
  }

  isOwner(): boolean {
    return this.role === 'owner';
  }

  isAdmin(): boolean {
    return this.role === 'owner' || this.role === 'admin';
  }

  clear() {
    this.tenantId = undefined;
    this.userId = undefined;
    this.role = undefined;
  }
}
