-- Billing: plans, subscriptions and payments. The paywall already gates premium
-- stories on user.subscribed_until; these tables are what set it.

CREATE TYPE "PlanInterval" AS ENUM ('month', 'year');
CREATE TYPE "SubscriptionStatus" AS ENUM ('incomplete', 'active', 'past_due', 'canceled', 'expired');
CREATE TYPE "PaymentProvider" AS ENUM ('stripe', 'momo', 'airtel', 'manual');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

CREATE TABLE "plan" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "interval" "PlanInterval" NOT NULL,
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "plan_code_key" ON "plan"("code");

CREATE TABLE "subscription" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'incomplete',
    "provider" "PaymentProvider" NOT NULL,
    "provider_ref" TEXT,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "subscription_user_id_status_idx" ON "subscription"("user_id", "status");
CREATE INDEX "subscription_status_current_period_end_idx" ON "subscription"("status", "current_period_end");

CREATE TABLE "payment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "provider" "PaymentProvider" NOT NULL,
    "provider_ref" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);
-- A webhook replay must not double-credit a reader (documents/05 §8).
CREATE UNIQUE INDEX "payment_provider_ref_key" ON "payment"("provider_ref");
CREATE INDEX "payment_user_id_created_at_idx" ON "payment"("user_id", "created_at");

ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment" ADD CONSTRAINT "payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
