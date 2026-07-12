-- Polymorphic engagement: comments / likes / shares on every content type.
-- Written by hand (not generated) so existing article comments and likes are
-- carried over rather than dropped.

-- CreateEnum
CREATE TYPE "EngagementTarget" AS ENUM ('article', 'gallery', 'episode', 'interactive', 'video');

-- ── Comments: article_id → (target_type, target_id) ─────────────────────────
ALTER TABLE "comment" ADD COLUMN "target_type" "EngagementTarget" NOT NULL DEFAULT 'article';
-- Nullable first, backfill, then enforce NOT NULL (existing rows have no value).
ALTER TABLE "comment" ADD COLUMN "target_id" UUID;
UPDATE "comment" SET "target_id" = "article_id" WHERE "target_id" IS NULL;
ALTER TABLE "comment" ALTER COLUMN "target_id" SET NOT NULL;
-- article_id stays as a nullable FK: it keeps the cascade for articles, and is
-- simply NULL for gallery/episode/interactive/video comments.
ALTER TABLE "comment" ALTER COLUMN "article_id" DROP NOT NULL;

CREATE INDEX "comment_target_type_target_id_status_created_at_idx"
  ON "comment"("target_type", "target_id", "status", "created_at");

-- ── Likes: article_like → content_like ──────────────────────────────────────
CREATE TABLE "content_like" (
    "user_id" UUID NOT NULL,
    "target_type" "EngagementTarget" NOT NULL,
    "target_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_like_pkey" PRIMARY KEY ("user_id","target_type","target_id")
);

CREATE INDEX "content_like_target_type_target_id_idx"
  ON "content_like"("target_type", "target_id");

ALTER TABLE "content_like" ADD CONSTRAINT "content_like_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry every existing article like across before dropping the old table.
INSERT INTO "content_like" ("user_id", "target_type", "target_id", "created_at")
SELECT "user_id", 'article'::"EngagementTarget", "article_id", "created_at"
FROM "article_like";

ALTER TABLE "article_like" DROP CONSTRAINT "article_like_article_id_fkey";
ALTER TABLE "article_like" DROP CONSTRAINT "article_like_user_id_fkey";
DROP TABLE "article_like";

-- ── Like / share counters on the multimedia types (articles already have them)
ALTER TABLE "gallery" ADD COLUMN "like_count" INTEGER NOT NULL DEFAULT 0,
                      ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "interactive" ADD COLUMN "like_count" INTEGER NOT NULL DEFAULT 0,
                          ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "podcast_episode" ADD COLUMN "like_count" INTEGER NOT NULL DEFAULT 0,
                              ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "video" ADD COLUMN "like_count" INTEGER NOT NULL DEFAULT 0,
                    ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0;
