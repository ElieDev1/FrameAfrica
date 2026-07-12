-- Media albums: group an event's photos so they can be found again.
CREATE TABLE "media_album" (
  "id"            UUID         NOT NULL DEFAULT uuid_generate_v4(),
  "name"          TEXT         NOT NULL,
  "slug"          TEXT         NOT NULL,
  "description"   TEXT,
  "event_date"    TIMESTAMP(3),
  "cover_url"     TEXT,
  "created_by_id" UUID         NOT NULL,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "media_album_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_album_slug_key" ON "media_album"("slug");
CREATE INDEX "media_album_created_at_idx" ON "media_album"("created_at");

ALTER TABLE "media_album"
  ADD CONSTRAINT "media_album_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Photos carry an optional album. Deleting an album unfiles its photos (SET NULL),
-- it never deletes them.
ALTER TABLE "media_asset" ADD COLUMN "album_id" UUID;

CREATE INDEX "media_asset_album_id_created_at_idx" ON "media_asset"("album_id", "created_at");

ALTER TABLE "media_asset"
  ADD CONSTRAINT "media_asset_album_id_fkey"
  FOREIGN KEY ("album_id") REFERENCES "media_album"("id") ON DELETE SET NULL ON UPDATE CASCADE;
