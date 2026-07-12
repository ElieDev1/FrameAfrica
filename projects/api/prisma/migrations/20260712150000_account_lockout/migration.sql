-- Brute-force account lockout: count failed sign-ins; lock after the threshold.
ALTER TABLE "user"
  ADD COLUMN "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "locked_at" TIMESTAMP(3);
