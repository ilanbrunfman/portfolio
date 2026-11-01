-- Step 8.2 (review): a time can be fixed without saying why. The edit is
-- still logged (who, when, before / after); the reason is optional.
ALTER TABLE "taim"."time_edits" ALTER COLUMN "reason" DROP NOT NULL;

ALTER TABLE "taim"."time_edits" DROP CONSTRAINT "time_edits_reason";
ALTER TABLE "taim"."time_edits" ADD CONSTRAINT "time_edits_reason" CHECK ("reason" IS NULL OR char_length(btrim("reason")) BETWEEN 1 AND 200);
