import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TenantContext } from '../common/tenant/tenant-context';

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
  findAll() {
    return this.paymentsService.findAll(this.getTenantId());
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id, this.getTenantId());
  }

  @Get('subscription/:subscriptionId')
  findBySubscriptionId(@Param('subscriptionId') subscriptionId: string) {
    return this.paymentsService.findBySubscriptionId(
      subscriptionId,
      this.getTenantId(),
    );
  }

  @Post()
  create(@Body() data: any) {
    return this.paymentsService.create(this.getTenantId(), data);
  }

  @Post(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.paymentsService.updateStatus(id, status, this.getTenantId());
  }
}
