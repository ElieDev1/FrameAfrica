-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('leaderboard', 'billboard', 'rectangle', 'halfpage', 'native');

-- CreateTable
CREATE TABLE "house_ad" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" TEXT NOT NULL,
    "image_url" TEXT,
    "link_url" TEXT NOT NULL,
    "placement" "AdPlacement" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "house_ad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "house_ad_placement_is_active_idx" ON "house_ad"("placement", "is_active");
