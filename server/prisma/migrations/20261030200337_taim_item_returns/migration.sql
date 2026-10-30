-- CreateEnum
CREATE TYPE "taim"."ReturnReason" AS ENUM ('COLD', 'WRONG_DISH', 'TASTE', 'UNDERCOOKED', 'ALLERGY', 'TOO_SLOW', 'OTHER');

-- AlterTable
ALTER TABLE "taim"."order_items" ADD COLUMN     "remakeOfId" INTEGER;

-- CreateTable
CREATE TABLE "taim"."item_returns" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "reason" "taim"."ReturnReason" NOT NULL,
    "note" TEXT,
    "staffId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_returns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_returns_orderItemId_key" ON "taim"."item_returns"("orderItemId");

-- CreateIndex
CREATE INDEX "item_returns_createdAt_idx" ON "taim"."item_returns"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_remakeOfId_key" ON "taim"."order_items"("remakeOfId");

-- AddForeignKey
ALTER TABLE "taim"."item_returns" ADD CONSTRAINT "item_returns_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "taim"."order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."item_returns" ADD CONSTRAINT "item_returns_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_remakeOfId_fkey" FOREIGN KEY ("remakeOfId") REFERENCES "taim"."order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Added by hand: a short note, and a dish can't be its own remake
ALTER TABLE "taim"."item_returns" ADD CONSTRAINT "item_returns_note_length" CHECK ("note" IS NULL OR char_length("note") <= 200);
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_remake_not_self" CHECK ("remakeOfId" IS NULL OR "remakeOfId" <> "id");
