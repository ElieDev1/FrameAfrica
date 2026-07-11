-- CreateEnum
CREATE TYPE "InquiryType" AS ENUM ('advertise', 'contact');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('new', 'in_progress', 'closed');

-- CreateTable
CREATE TABLE "inquiry" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" "InquiryType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "budget" TEXT,
    "placement" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_campaign" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "sender_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiry_type_status_created_at_idx" ON "inquiry"("type", "status", "created_at");

-- CreateIndex
CREATE INDEX "newsletter_campaign_created_at_idx" ON "newsletter_campaign"("created_at");
