-- AlterTable
ALTER TABLE "taim"."order_items" ADD COLUMN     "round" INTEGER;

-- Added by hand:
-- Dishes already sent count as round 1 of their order.
UPDATE "taim"."order_items" SET "round" = 1 WHERE "status" <> 'NEW';

-- A round is 1 or more, and a dish has one exactly when it has been sent
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_round_when_sent"
    CHECK (("status" = 'NEW') = ("round" IS NULL) AND ("round" IS NULL OR "round" > 0));
