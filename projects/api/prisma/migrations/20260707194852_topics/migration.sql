-- CreateTable
CREATE TABLE "topic" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_topic" (
    "article_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,

    CONSTRAINT "article_topic_pkey" PRIMARY KEY ("article_id","topic_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topic_slug_key" ON "topic"("slug");

-- CreateIndex
CREATE INDEX "article_topic_topic_id_idx" ON "article_topic"("topic_id");

-- AddForeignKey
ALTER TABLE "article_topic" ADD CONSTRAINT "article_topic_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_topic" ADD CONSTRAINT "article_topic_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
