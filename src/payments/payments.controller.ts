import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TenantContext } from '../common/tenant/tenant-context';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtTenantGuard } from '../common/guards/jwt-tenant.guard';


@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly tenantContext: TenantContext,
  ) {}

  private getTenantId(): string {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context not available');
    }
    return tenantId;
  }

  @Get()
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  findAll() {
    return this.paymentsService.findAll(this.getTenantId());
  }

  @Get(':id')
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id, this.getTenantId());
  }

  @Get('subscription/:subscriptionId')
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin', 'member')
  findBySubscriptionId(@Param('subscriptionId') subscriptionId: string) {
    return this.paymentsService.findBySubscriptionId(
      subscriptionId,
      this.getTenantId(),
    );
  }

  @Post()
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  create(@Body() data: any) {
    return this.paymentsService.create(this.getTenantId(), data);
  }

  @Post(':id/status')
  @UseGuards(JwtTenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.paymentsService.updateStatus(id, status, this.getTenantId());
  }
}
