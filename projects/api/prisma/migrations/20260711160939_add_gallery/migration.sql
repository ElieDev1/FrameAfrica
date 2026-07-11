-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "gallery" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "cover_alt" TEXT,
    "images" JSONB NOT NULL DEFAULT '[]',
    "status" "MediaStatus" NOT NULL DEFAULT 'draft',
    "author_id" UUID NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_slug_key" ON "gallery"("slug");

-- CreateIndex
CREATE INDEX "gallery_status_published_at_idx" ON "gallery"("status", "published_at");

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
