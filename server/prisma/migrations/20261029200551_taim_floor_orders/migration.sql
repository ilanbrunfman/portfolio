-- CreateEnum
CREATE TYPE "taim"."OrderType" AS ENUM ('TABLE', 'TAKEOUT');

-- CreateEnum
CREATE TYPE "taim"."OrderStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "taim"."DishStatus" AS ENUM ('PREPARING', 'SENT_OUT', 'CAME_BACK');

-- CreateTable
CREATE TABLE "taim"."dining_tables" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taim"."orders" (
    "id" SERIAL NOT NULL,
    "type" "taim"."OrderType" NOT NULL,
    "tableId" INTEGER,
    "guests" INTEGER,
    "customerName" TEXT,
    "status" "taim"."OrderStatus" NOT NULL DEFAULT 'OPEN',
    "openedById" INTEGER NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taim"."order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "taim"."DishStatus" NOT NULL DEFAULT 'PREPARING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentOutAt" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_label_key" ON "taim"."dining_tables"("label");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "taim"."orders"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "taim"."order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_status_idx" ON "taim"."order_items"("status");

-- AddForeignKey
ALTER TABLE "taim"."orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "taim"."dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."orders" ADD CONSTRAINT "orders_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "taim"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "taim"."menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- Rules added by hand (Prisma can't describe these) ----------

-- A table can't be seated twice: at most one OPEN order per table. A
-- partial unique index only looks at the rows matching its WHERE, so closed
-- orders (yesterday's, last hour's) don't count. Two hosts seating the same
-- table at the same moment → the second insert fails, the API answers 409.
CREATE UNIQUE INDEX "orders_one_open_per_table" ON "taim"."orders" ("tableId") WHERE "status" = 'OPEN';

-- A table order has a table and a guest count; a take-out has a name and no table
ALTER TABLE "taim"."orders" ADD CONSTRAINT "orders_type_fields" CHECK (
    ("type" = 'TABLE' AND "tableId" IS NOT NULL AND "guests" > 0 AND "customerName" IS NULL)
    OR ("type" = 'TAKEOUT' AND "tableId" IS NULL AND "guests" IS NULL AND "customerName" IS NOT NULL)
);

-- A closed order has a closing time, an open one doesn't
ALTER TABLE "taim"."orders" ADD CONSTRAINT "orders_closed_at" CHECK (("status" = 'CLOSED') = ("closedAt" IS NOT NULL));

ALTER TABLE "taim"."dining_tables" ADD CONSTRAINT "dining_tables_seats_positive" CHECK ("seats" > 0);
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_price_positive" CHECK ("price" > 0);
