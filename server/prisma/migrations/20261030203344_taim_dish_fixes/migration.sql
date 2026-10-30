-- AlterEnum
ALTER TYPE "taim"."LossKind" ADD VALUE 'FIX';

-- DropIndex
DROP INDEX "taim"."item_returns_orderItemId_key";

-- CreateIndex
CREATE INDEX "item_returns_orderItemId_idx" ON "taim"."item_returns"("orderItemId");


-- Added by hand: a dish is lost at most once (one return or waste); fixes
-- can repeat. ('FIX' can't be named here: it's new in this migration.)
CREATE UNIQUE INDEX "item_returns_one_loss_per_dish" ON "taim"."item_returns"("orderItemId") WHERE "kind" IN ('RETURN', 'WASTE');
