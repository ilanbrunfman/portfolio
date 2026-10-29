-- AlterTable
ALTER TABLE "taim"."dining_tables" ADD COLUMN     "joinedToId" INTEGER;

-- AddForeignKey
ALTER TABLE "taim"."dining_tables" ADD CONSTRAINT "dining_tables_joinedToId_fkey" FOREIGN KEY ("joinedToId") REFERENCES "taim"."dining_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Added by hand: a table can't be joined to itself
ALTER TABLE "taim"."dining_tables" ADD CONSTRAINT "dining_tables_not_joined_to_itself" CHECK ("joinedToId" IS NULL OR "joinedToId" <> "id");
