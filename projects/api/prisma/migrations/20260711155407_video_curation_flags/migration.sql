-- AlterTable
ALTER TABLE "video" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false;
