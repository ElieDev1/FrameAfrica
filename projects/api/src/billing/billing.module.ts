import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import {
  BillingAdminController,
  BillingController,
  BillingMeController,
  BillingWebhookController,
} from './billing.controller';
import { BillingService } from './billing.service';

/**
 * Subscriptions and payments. AdminModule is imported for AdminSettingsService,
 * which resolves the gateway keys (Stripe / MoMo / Airtel) an admin sets in the
 * dashboard — so credentials never live in the code.
 */
@Module({
  imports: [AuthModule, AdminModule],
  controllers: [
    BillingController,
    BillingMeController,
    BillingWebhookController,
    BillingAdminController,
  ],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
