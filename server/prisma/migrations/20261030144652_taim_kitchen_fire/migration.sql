-- AlterTable
ALTER TABLE "taim"."order_items" ADD COLUMN     "firedById" INTEGER,
ADD COLUMN     "kitchenFired" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_firedById_fkey" FOREIGN KEY ("firedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Added by hand: a dish the kitchen fired was sent to the kitchen
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_kitchen_fired_sent" CHECK (NOT "kitchenFired" OR "firedAt" IS NOT NULL);
