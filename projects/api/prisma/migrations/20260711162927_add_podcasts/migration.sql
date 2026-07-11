-- CreateEnum
CREATE TYPE "PodcastMediaKind" AS ENUM ('audio', 'video');

-- CreateTable
CREATE TABLE "podcast_show" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "spotify_url" TEXT,
    "apple_url" TEXT,
    "rss_url" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'draft',
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "podcast_show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_episode" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "show_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "media_kind" "PodcastMediaKind" NOT NULL DEFAULT 'audio',
    "media_url" TEXT NOT NULL,
    "cover_url" TEXT,
    "duration_sec" INTEGER,
    "episode_no" INTEGER,
    "status" "MediaStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "podcast_episode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "podcast_show_slug_key" ON "podcast_show"("slug");

-- CreateIndex
CREATE INDEX "podcast_show_status_idx" ON "podcast_show"("status");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_episode_slug_key" ON "podcast_episode"("slug");

-- CreateIndex
CREATE INDEX "podcast_episode_show_id_published_at_idx" ON "podcast_episode"("show_id", "published_at");

-- AddForeignKey
ALTER TABLE "podcast_episode" ADD CONSTRAINT "podcast_episode_show_id_fkey" FOREIGN KEY ("show_id") REFERENCES "podcast_show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
