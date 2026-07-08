-- AlterTable
ALTER TABLE "article" ADD COLUMN     "is_live" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "live_update" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "article_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "headline" TEXT,
    "body" TEXT NOT NULL,
    "is_key_event" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_update_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_update_article_id_created_at_idx" ON "live_update"("article_id", "created_at");

-- AddForeignKey
ALTER TABLE "live_update" ADD CONSTRAINT "live_update_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_update" ADD CONSTRAINT "live_update_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
