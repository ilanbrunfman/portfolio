-- Give every dish a place in its category (1 = top).
--
-- Edited by hand: Prisma's draft added a required column with no value,
-- which fails on a table that already has dishes. Instead:
-- 1. add the column, empty for now
-- 2. number the existing dishes per category in their current order (by
--    id) with a window function, like the bank's running balance
-- 3. make it required

ALTER TABLE "taim"."menu_items" ADD COLUMN "position" INTEGER;

UPDATE "taim"."menu_items" AS m
SET "position" = numbered.n
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "categoryId" ORDER BY id) AS n
    FROM "taim"."menu_items"
) AS numbered
WHERE m.id = numbered.id;

ALTER TABLE "taim"."menu_items" ALTER COLUMN "position" SET NOT NULL;

-- Look dishes up by category in menu order
DROP INDEX "taim"."menu_items_categoryId_idx";
CREATE INDEX "menu_items_categoryId_position_idx" ON "taim"."menu_items"("categoryId", "position");
