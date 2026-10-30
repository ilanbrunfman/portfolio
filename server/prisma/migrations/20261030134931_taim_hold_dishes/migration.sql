-- AlterTable
ALTER TABLE "taim"."order_items" ADD COLUMN     "held" BOOLEAN NOT NULL DEFAULT false;

-- Added by hand: only a dish not sent to the kitchen yet can be on hold
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_held_only_new" CHECK (NOT "held" OR "status" = 'NEW');
