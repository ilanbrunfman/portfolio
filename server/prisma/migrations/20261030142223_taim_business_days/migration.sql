-- AlterTable
ALTER TABLE "taim"."orders" ADD COLUMN     "businessDayId" INTEGER;

-- CreateTable
CREATE TABLE "taim"."business_days" (
    "id" SERIAL NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedById" INTEGER NOT NULL,
    "billCount" INTEGER NOT NULL,
    "tableBills" INTEGER NOT NULL,
    "takeoutBills" INTEGER NOT NULL,
    "guests" INTEGER NOT NULL,
    "sales" INTEGER NOT NULL,
    "cameBack" INTEGER NOT NULL,
    "cameBackValue" INTEGER NOT NULL,

    CONSTRAINT "business_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_days_closedAt_idx" ON "taim"."business_days"("closedAt");

-- CreateIndex
CREATE INDEX "orders_businessDayId_idx" ON "taim"."orders"("businessDayId");

-- AddForeignKey
ALTER TABLE "taim"."orders" ADD CONSTRAINT "orders_businessDayId_fkey" FOREIGN KEY ("businessDayId") REFERENCES "taim"."business_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."business_days" ADD CONSTRAINT "business_days_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Added by hand: a day's report adds up, and never runs backwards
ALTER TABLE "taim"."business_days" ADD CONSTRAINT "business_days_counts" CHECK (
    "billCount" >= 0 AND "tableBills" >= 0 AND "takeoutBills" >= 0 AND "guests" >= 0
    AND "sales" >= 0 AND "cameBack" >= 0 AND "cameBackValue" >= 0
    AND "billCount" = "tableBills" + "takeoutBills"
);
ALTER TABLE "taim"."business_days" ADD CONSTRAINT "business_days_dates" CHECK ("closedAt" >= "openedAt");

-- Added by hand: only a closed bill can belong to a closed day
ALTER TABLE "taim"."orders" ADD CONSTRAINT "orders_day_only_closed" CHECK ("businessDayId" IS NULL OR "status" = 'CLOSED');
