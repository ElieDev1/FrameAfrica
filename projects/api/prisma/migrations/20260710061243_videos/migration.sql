-- CreateTable
CREATE TABLE "video" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "youtube_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_youtube_id_key" ON "video"("youtube_id");

-- CreateIndex
CREATE INDEX "video_published_at_idx" ON "video"("published_at");
