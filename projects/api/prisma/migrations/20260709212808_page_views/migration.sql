-- CreateTable
CREATE TABLE "page_view" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "article_id" UUID,
    "path" TEXT NOT NULL,
    "referrer_host" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_view_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_view_created_at_idx" ON "page_view"("created_at");

-- CreateIndex
CREATE INDEX "page_view_article_id_created_at_idx" ON "page_view"("article_id", "created_at");

-- AddForeignKey
ALTER TABLE "page_view" ADD CONSTRAINT "page_view_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
