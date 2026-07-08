-- CreateTable
CREATE TABLE "article_like" (
    "user_id" UUID NOT NULL,
    "article_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_like_pkey" PRIMARY KEY ("user_id","article_id")
);

-- CreateIndex
CREATE INDEX "article_like_article_id_idx" ON "article_like"("article_id");

-- AddForeignKey
ALTER TABLE "article_like" ADD CONSTRAINT "article_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_like" ADD CONSTRAINT "article_like_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
