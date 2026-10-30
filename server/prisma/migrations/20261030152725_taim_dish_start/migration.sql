-- AlterTable
ALTER TABLE "taim"."order_items" ADD COLUMN     "servedById" INTEGER,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "startedById" INTEGER;

-- AddForeignKey
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_servedById_fkey" FOREIGN KEY ("servedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Added by hand: only a dish that was sent to the kitchen can have started
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_started_after_sent" CHECK ("startedAt" IS NULL OR ("status" <> 'NEW' AND "firedAt" IS NOT NULL));
