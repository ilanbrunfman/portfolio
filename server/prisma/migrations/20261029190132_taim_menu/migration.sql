-- CreateTable
CREATE TABLE "taim"."categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taim"."menu_items" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "taim"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_name_key" ON "taim"."menu_items"("name");

-- CreateIndex
CREATE INDEX "menu_items_categoryId_idx" ON "taim"."menu_items"("categoryId");

-- AddForeignKey
ALTER TABLE "taim"."menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "taim"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Added by hand (Prisma can't describe CHECK rules): a dish always costs
-- something. The API validates this too; the database is the last line.
ALTER TABLE "taim"."menu_items" ADD CONSTRAINT "menu_items_price_positive" CHECK ("price" > 0);
