-- CreateTable
CREATE TABLE "media_asset" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "uploader_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "credit" TEXT,
    "licence" TEXT,
    "mime" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "original_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_asset_uploader_id_created_at_idx" ON "media_asset"("uploader_id", "created_at");

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
