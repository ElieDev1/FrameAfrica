-- AlterTable
ALTER TABLE "user" ADD COLUMN     "subscribed_until" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "meter_read" (
    "reader_key" TEXT NOT NULL,
    "article_id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meter_read_pkey" PRIMARY KEY ("reader_key","article_id","period")
);

-- CreateIndex
CREATE INDEX "meter_read_reader_key_period_idx" ON "meter_read"("reader_key", "period");
