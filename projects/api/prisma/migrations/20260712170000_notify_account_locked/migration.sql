-- Notify admins when an account is locked by the brute-force guard.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'account_locked';
