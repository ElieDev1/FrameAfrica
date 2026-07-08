-- AlterTable
ALTER TABLE "comment" ADD COLUMN     "like_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "report_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "comment_like" (
    "user_id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_like_pkey" PRIMARY KEY ("user_id","comment_id")
);

-- CreateTable
CREATE TABLE "comment_report" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "comment_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_like_comment_id_idx" ON "comment_like"("comment_id");

-- CreateIndex
CREATE INDEX "comment_report_comment_id_idx" ON "comment_report"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_report_comment_id_reporter_id_key" ON "comment_report"("comment_id", "reporter_id");

-- AddForeignKey
ALTER TABLE "comment_like" ADD CONSTRAINT "comment_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_like" ADD CONSTRAINT "comment_like_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_report" ADD CONSTRAINT "comment_report_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_report" ADD CONSTRAINT "comment_report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
