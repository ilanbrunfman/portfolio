-- AlterTable
ALTER TABLE "taim"."orders" ADD COLUMN     "customerPhone" TEXT;

-- Added by hand: only a take-out has a phone number. It stays optional in
-- the database (take-outs from before this change have none); the API
-- requires it for new take-outs.
ALTER TABLE "taim"."orders" ADD CONSTRAINT "orders_phone_takeout_only" CHECK ("type" = 'TAKEOUT' OR "customerPhone" IS NULL);
