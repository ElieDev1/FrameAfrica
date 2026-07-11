-- CreateEnum
CREATE TYPE "InteractiveProvider" AS ENUM ('datawrapper', 'flourish', 'infogram', 'google', 'youtube');

-- CreateTable
CREATE TABLE "interactive" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "provider" "InteractiveProvider" NOT NULL,
    "embed_url" TEXT NOT NULL,
    "cover_url" TEXT,
    "aspect_ratio" TEXT NOT NULL DEFAULT '16/9',
    "source" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'draft',
    "author_id" UUID NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "interactive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "interactive_slug_key" ON "interactive"("slug");

-- CreateIndex
CREATE INDEX "interactive_status_published_at_idx" ON "interactive"("status", "published_at");
