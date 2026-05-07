-- Adds the cropped image URL slot so the admin keeps both the user's original
-- (untouched) and the cropped version (what they saw in the editor). The
-- column is nullable for backwards compatibility with orders created before
-- the feature.
ALTER TABLE "order_photos" ADD COLUMN "cropped_url" text;
