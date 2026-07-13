-- Author profiles: a public byline identity for anyone who writes.
--
-- `author_slug` is the /author/<slug> URL. It is nullable so an existing row is
-- valid before the backfill below runs, and UNIQUE so two "Eric Mugisha"s can
-- never collide onto one page.

ALTER TABLE "user" ADD COLUMN "author_slug" TEXT;
ALTER TABLE "user" ADD COLUMN "bio" TEXT;
ALTER TABLE "user" ADD COLUMN "job_title" TEXT;

-- Backfill: slugify the display name, and where that collides (two journalists
-- with the same name) fall back to a short suffix from the user's id, so the
-- unique index below can never fail on live data.
WITH slugged AS (
  SELECT
    id,
    NULLIF(
      regexp_replace(
        regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g'),
        '(^-+|-+$)', '', 'g'
      ),
      ''
    ) AS base
  FROM "user"
),
numbered AS (
  SELECT
    id,
    COALESCE(base, 'author') AS base,
    ROW_NUMBER() OVER (PARTITION BY COALESCE(base, 'author') ORDER BY id) AS rn
  FROM slugged
)
UPDATE "user" AS u
SET author_slug = CASE
  WHEN n.rn = 1 THEN n.base
  ELSE n.base || '-' || left(replace(u.id::text, '-', ''), 6)
END
FROM numbered AS n
WHERE u.id = n.id;

CREATE UNIQUE INDEX "user_author_slug_key" ON "user"("author_slug");
