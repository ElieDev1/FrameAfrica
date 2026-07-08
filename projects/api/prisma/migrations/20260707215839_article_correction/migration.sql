-- CreateTable
CREATE TABLE "article_correction" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "article_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "editor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_correction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_correction_article_id_created_at_idx" ON "article_correction"("article_id", "created_at");

-- AddForeignKey
ALTER TABLE "article_correction" ADD CONSTRAINT "article_correction_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_correction" ADD CONSTRAINT "article_correction_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
