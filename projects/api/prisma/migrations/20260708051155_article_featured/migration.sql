-- AlterTable
ALTER TABLE "article" ADD COLUMN     "featured_at" TIMESTAMP(3),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;
