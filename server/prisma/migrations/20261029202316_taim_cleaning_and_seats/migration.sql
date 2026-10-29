-- AlterTable
ALTER TABLE "taim"."dining_tables" ADD COLUMN     "needsCleaning" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "taim"."order_items" ADD COLUMN     "seat" INTEGER;

-- Added by hand: a seat number is 1 or more (null = shared / take-out)
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_seat_positive" CHECK ("seat" IS NULL OR "seat" > 0);
