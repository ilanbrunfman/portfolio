-- Move the bank tracker into its own Postgres schema, "bank".
--
-- Written by hand: Prisma's generated version created new, empty tables in
-- "bank". SET SCHEMA moves the existing tables instead, so every row stays,
-- together with its indexes, keys and id sequences. The two enum types move
-- the same way; columns keep using them.

CREATE SCHEMA IF NOT EXISTS "bank";

ALTER TYPE "public"."AccountType" SET SCHEMA "bank";
ALTER TYPE "public"."CategoryKind" SET SCHEMA "bank";

ALTER TABLE "public"."users" SET SCHEMA "bank";
ALTER TABLE "public"."sessions" SET SCHEMA "bank";
ALTER TABLE "public"."accounts" SET SCHEMA "bank";
ALTER TABLE "public"."categories" SET SCHEMA "bank";
ALTER TABLE "public"."transactions" SET SCHEMA "bank";
