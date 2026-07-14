-- Web push: a browser that has agreed to receive breaking-news alerts.
--
-- `endpoint` is the push service's URL for that browser and IS the identity of
-- the subscription — UNIQUE, so re-subscribing the same browser updates its row
-- rather than fanning out duplicate alerts. `user_id` is nullable: an alert is a
-- promise to a browser, and a reader need not have an account to take it.

CREATE TABLE "push_subscription" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_id" UUID,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sent_at" TIMESTAMP(3),

    CONSTRAINT "push_subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscription_endpoint_key" ON "push_subscription"("endpoint");
CREATE INDEX "push_subscription_user_id_idx" ON "push_subscription"("user_id");

-- Deleting an account takes its alerts with it.
ALTER TABLE "push_subscription"
  ADD CONSTRAINT "push_subscription_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
