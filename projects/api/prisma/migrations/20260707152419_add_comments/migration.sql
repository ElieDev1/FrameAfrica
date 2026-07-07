-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('visible', 'pending', 'hidden', 'removed');

-- CreateTable
CREATE TABLE "comment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "article_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "parent_id" UUID,
    "body" TEXT NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'visible',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_article_id_status_created_at_idx" ON "comment"("article_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
