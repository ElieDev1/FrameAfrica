-- CreateEnum
CREATE TYPE "TipStatus" AS ENUM ('new', 'reviewing', 'actioned', 'dismissed');

-- CreateTable
CREATE TABLE "tip" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "message" TEXT NOT NULL,
    "contact" TEXT,
    "status" "TipStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tip_status_created_at_idx" ON "tip"("status", "created_at");
