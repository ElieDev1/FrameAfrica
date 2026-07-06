-- CreateTable
CREATE TABLE "article_revision" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "article_id" UUID NOT NULL,
    "editor_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "change_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_revision_article_id_created_at_idx" ON "article_revision"("article_id", "created_at");

-- AddForeignKey
ALTER TABLE "article_revision" ADD CONSTRAINT "article_revision_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_revision" ADD CONSTRAINT "article_revision_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
