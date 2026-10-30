-- AlterTable
ALTER TABLE "taim"."menu_items" ADD COLUMN     "prepMinutes" INTEGER;

-- Added by hand: a prep time is at least a minute (and at most 3 hours)
ALTER TABLE "taim"."menu_items" ADD CONSTRAINT "menu_items_prep_minutes_range" CHECK ("prepMinutes" IS NULL OR "prepMinutes" BETWEEN 1 AND 180);
