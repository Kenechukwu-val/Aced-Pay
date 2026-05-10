import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { TenantContext } from '../common/tenant/tenant-context';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly tenantContext: TenantContext
  ) {}

  @Get()
  findAll() {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.findOne(id, tenantId);
  }

  @Post()
  create(@Body('planId') planId: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.create(tenantId, planId);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id') id: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.cancel(id, tenantId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.delete(id, tenantId);
  }
}
