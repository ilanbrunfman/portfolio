-- Dishes start as NEW ("not sent"): the waiter builds the order, then sends
-- it to the kitchen, which turns them PREPARING.
--
-- Edited by hand:
-- - NEW goes BEFORE 'PREPARING', so the statuses sort in the order a dish
--   moves through them.
-- - No default for status: Postgres can't use an enum value in the same
--   transaction that adds it, and every insert says its status anyway.
-- - Dishes already in the kitchen get firedAt = when they were added.

ALTER TYPE "taim"."DishStatus" ADD VALUE 'NEW' BEFORE 'PREPARING';

ALTER TABLE "taim"."order_items" ADD COLUMN "firedAt" TIMESTAMP(3),
ALTER COLUMN "status" DROP DEFAULT;

UPDATE "taim"."order_items" SET "firedAt" = "createdAt";
