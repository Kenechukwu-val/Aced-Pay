import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './common/tenant/tenant.module';
import { TenantMiddleware } from './common/tenant/tenant.middleware';
import { TenantsService } from './tenants/tenants.service';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsModule } from './tenants/tenants.module';
import { StripeService } from './stripe/stripe.service';
import { StripeModule } from './stripe/stripe.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TenantModule,
    PlansModule,
    SubscriptionsModule,
    PaymentsModule,
    PrismaModule,
    TenantsModule,
    StripeModule,
  ],
  controllers: [AppController, TenantsController],
  providers: [AppService, TenantsService, StripeService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
