-- CreateEnum
CREATE TYPE "taim"."Allergen" AS ENUM ('GLUTEN', 'DAIRY', 'EGG', 'PEANUTS', 'TREE_NUTS', 'SESAME', 'FISH', 'SHELLFISH', 'SOY');

-- AlterTable
-- Step 5.4: what a dish contains (never null: an empty list = nothing to declare)
ALTER TABLE "taim"."menu_items" ADD COLUMN     "allergens" "taim"."Allergen"[] NOT NULL DEFAULT ARRAY[]::"taim"."Allergen"[];

-- AlterTable
ALTER TABLE "taim"."order_items" ADD COLUMN     "allergyConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allergySeenAt" TIMESTAMP(3),
ADD COLUMN     "allergySeenById" INTEGER;

-- CreateTable
CREATE TABLE "taim"."seat_allergies" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "seat" INTEGER,
    "allergens" "taim"."Allergen"[] NOT NULL DEFAULT ARRAY[]::"taim"."Allergen"[],
    "note" TEXT,
    "notedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_allergies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- One row per seat per bill, and one "whole table / take-out" row (seat
-- null): NULLS NOT DISTINCT, so two nulls count as the same seat
CREATE UNIQUE INDEX "seat_allergies_orderId_seat_key" ON "taim"."seat_allergies"("orderId", "seat") NULLS NOT DISTINCT;

-- AddForeignKey
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_allergySeenById_fkey" FOREIGN KEY ("allergySeenById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."seat_allergies" ADD CONSTRAINT "seat_allergies_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "taim"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."seat_allergies" ADD CONSTRAINT "seat_allergies_notedById_fkey" FOREIGN KEY ("notedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Hand-written rules (Prisma can't express them):
-- a seat is 1 or more; an allergy says something (allergens or a note); a note is short
ALTER TABLE "taim"."seat_allergies" ADD CONSTRAINT "seat_allergies_valid" CHECK (
    ("seat" IS NULL OR "seat" >= 1)
    AND (cardinality("allergens") > 0 OR "note" IS NOT NULL)
    AND ("note" IS NULL OR char_length("note") BETWEEN 1 AND 200)
);

-- "Seen" has both when and who (or neither)
ALTER TABLE "taim"."order_items" ADD CONSTRAINT "order_items_allergy_seen" CHECK (("allergySeenAt" IS NULL) = ("allergySeenById" IS NULL));
