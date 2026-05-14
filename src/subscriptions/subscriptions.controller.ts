import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { TenantContext } from '../common/tenant/tenant-context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtTenantGuard } from '../common/guards/jwt-tenant.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly tenantContext: TenantContext
  ) {}

  @Get()
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin') // Only owners and admins can view subscriptions for their tenant
  findAll() {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.findAll(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin', 'member') // Owners, admins, and members can view subscription details for their tenant
  findOne(@Param('id') id: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.findOne(id, tenantId);
  }

  @Post()
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin') // Only owners and admins can create subscriptions for their tenant
  create(@Body('planId') planId: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.create(tenantId, planId);
  }

  @Post(':id/cancel')
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin') // Only owners and admins can cancel subscriptions for their tenant
  cancel(@Param('id') id: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.cancel(tenantId, id);
  }

  @Delete(':id')
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner') // Only owners can delete subscriptions for their tenant
  delete(@Param('id') id: string) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return this.subscriptionsService.delete(id, tenantId);
  }
}
