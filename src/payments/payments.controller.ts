import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  async findAll() {
    return this.paymentsService.findAll();
  }

  @Get('subscription/:subscriptionId')
  async findBySubscriptionId(@Param('subscriptionId') subscriptionId: string) {
    return this.paymentsService.findBySubscriptionId(subscriptionId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post()
  async create(
    @Body()
    data: {
      subscriptionId: string;
      amount: number;
      currency?: string;
      paymentMethod?: string;
      transactionId?: string;
    },
  ) {
    return this.paymentsService.create(data);
  }

  @Post(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.paymentsService.updateStatus(id, status);
  }
}
