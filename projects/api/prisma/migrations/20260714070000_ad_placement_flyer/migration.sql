-- A new house-ad placement: the homepage flyer banner.
--
-- Adding a value to an existing enum, rather than a parallel "flyer" table, so
-- the flyer inherits everything house ads already have: the admin CRUD, the
-- active toggle, impressions, and click-through tracking.
--
-- Postgres 12+ allows ADD VALUE inside a transaction as long as the new value
-- isn't *used* in the same transaction — nothing here does.

ALTER TYPE "AdPlacement" ADD VALUE IF NOT EXISTS 'flyer';
