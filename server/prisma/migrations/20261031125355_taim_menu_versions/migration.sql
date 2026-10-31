-- Step 3.1: menu versions. Today's menu becomes v1 ("Starting menu"), the
-- active one; every existing category and dish belongs to it. Written by
-- hand: the new required columns are filled for existing rows first.

-- CreateEnum
CREATE TYPE "taim"."MenuVersionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "taim"."menu_versions" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT,
    "note" TEXT,
    "status" "taim"."MenuVersionStatus" NOT NULL,
    "basedOnId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedById" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),

    CONSTRAINT "menu_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "menu_versions_number_key" ON "taim"."menu_versions"("number");

-- v1: the menu as it is now, in use since the first order (or now)
INSERT INTO "taim"."menu_versions" ("number", "name", "status", "publishedAt", "activeFrom")
SELECT 1, 'Starting menu', 'ACTIVE', CURRENT_TIMESTAMP, COALESCE((SELECT MIN("openedAt") FROM "taim"."orders"), CURRENT_TIMESTAMP);

-- Categories and dishes join v1
ALTER TABLE "taim"."categories" ADD COLUMN "versionId" INTEGER;
UPDATE "taim"."categories" SET "versionId" = (SELECT "id" FROM "taim"."menu_versions" WHERE "number" = 1);
ALTER TABLE "taim"."categories" ALTER COLUMN "versionId" SET NOT NULL;

ALTER TABLE "taim"."menu_items" ADD COLUMN "versionId" INTEGER;
UPDATE "taim"."menu_items" i SET "versionId" = c."versionId" FROM "taim"."categories" c WHERE c."id" = i."categoryId";
ALTER TABLE "taim"."menu_items" ALTER COLUMN "versionId" SET NOT NULL;

-- dishKey: the same dish across versions (a fresh id for each existing dish)
ALTER TABLE "taim"."menu_items" ADD COLUMN "dishKey" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "taim"."menu_items" ALTER COLUMN "dishKey" DROP DEFAULT;

-- Names are unique within a version (not across all of them)
DROP INDEX "taim"."categories_name_key";
DROP INDEX "taim"."menu_items_name_key";
CREATE UNIQUE INDEX "categories_versionId_name_key" ON "taim"."categories"("versionId", "name");
CREATE UNIQUE INDEX "categories_id_versionId_key" ON "taim"."categories"("id", "versionId");
CREATE UNIQUE INDEX "menu_items_versionId_name_key" ON "taim"."menu_items"("versionId", "name");
CREATE INDEX "menu_items_dishKey_idx" ON "taim"."menu_items"("dishKey");

-- A dish's category is in the same version (composite foreign key)
ALTER TABLE "taim"."menu_items" DROP CONSTRAINT "menu_items_categoryId_fkey";
ALTER TABLE "taim"."menu_items" ADD CONSTRAINT "menu_items_categoryId_versionId_fkey" FOREIGN KEY ("categoryId", "versionId") REFERENCES "taim"."categories"("id", "versionId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."menu_versions" ADD CONSTRAINT "menu_versions_basedOnId_fkey" FOREIGN KEY ("basedOnId") REFERENCES "taim"."menu_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "taim"."menu_versions" ADD CONSTRAINT "menu_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "taim"."menu_versions" ADD CONSTRAINT "menu_versions_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "taim"."categories" ADD CONSTRAINT "categories_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "taim"."menu_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "taim"."menu_items" ADD CONSTRAINT "menu_items_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "taim"."menu_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- At most one active, one draft and one scheduled version
CREATE UNIQUE INDEX "menu_versions_one_active" ON "taim"."menu_versions"("status") WHERE "status" = 'ACTIVE';
CREATE UNIQUE INDEX "menu_versions_one_draft" ON "taim"."menu_versions"("status") WHERE "status" = 'DRAFT';
CREATE UNIQUE INDEX "menu_versions_one_scheduled" ON "taim"."menu_versions"("status") WHERE "status" = 'SCHEDULED';

-- Dates match the status: in use (or scheduled) means a start; archived
-- means it also ended, never before it started; a draft has neither
ALTER TABLE "taim"."menu_versions" ADD CONSTRAINT "menu_versions_dates" CHECK (
    ("status" = 'DRAFT' AND "activeFrom" IS NULL AND "activeTo" IS NULL)
    OR ("status" IN ('SCHEDULED', 'ACTIVE') AND "activeFrom" IS NOT NULL AND "activeTo" IS NULL)
    OR ("status" = 'ARCHIVED' AND "activeFrom" IS NOT NULL AND "activeTo" IS NOT NULL AND "activeTo" >= "activeFrom")
);
-- Short texts
ALTER TABLE "taim"."menu_versions" ADD CONSTRAINT "menu_versions_texts" CHECK (
    char_length("name") BETWEEN 1 AND 60 AND ("season" IS NULL OR char_length("season") <= 30) AND ("note" IS NULL OR char_length("note") <= 200)
);
