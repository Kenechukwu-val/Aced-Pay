import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaystackService } from '../paystack/paystack.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlansController],
  providers: [PlansService, PaystackService],
})
export class PlansModule {}
