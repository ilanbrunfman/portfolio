-- CreateTable
CREATE TABLE "taim"."time_entries" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "forgot" BOOLEAN NOT NULL DEFAULT false,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taim"."time_breaks" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),

    CONSTRAINT "time_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taim"."time_edits" (
    "id" SERIAL NOT NULL,
    "entryId" INTEGER NOT NULL,
    "editedById" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_edits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_entries_staffId_clockIn_idx" ON "taim"."time_entries"("staffId", "clockIn");

-- CreateIndex
CREATE INDEX "time_breaks_entryId_idx" ON "taim"."time_breaks"("entryId");

-- CreateIndex
CREATE INDEX "time_edits_entryId_idx" ON "taim"."time_edits"("entryId");

-- AddForeignKey
ALTER TABLE "taim"."time_entries" ADD CONSTRAINT "time_entries_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."time_breaks" ADD CONSTRAINT "time_breaks_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "taim"."time_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."time_edits" ADD CONSTRAINT "time_edits_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "taim"."time_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taim"."time_edits" ADD CONSTRAINT "time_edits_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "taim"."staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Hand-written rules (step 8.2) that Prisma can't express

-- btree_gist lets an exclusion constraint mix "same person" (=) with
-- "overlapping time" (&&)
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;

-- Clock-out after clock-in; an entry closed for a forgotten clock-out has a clock-out
ALTER TABLE "taim"."time_entries" ADD CONSTRAINT "time_entries_times" CHECK (
    ("clockOut" IS NULL OR "clockOut" > "clockIn")
    AND (NOT "forgot" OR "clockOut" IS NOT NULL)
);
-- One open entry per person (clocked in and not out)
CREATE UNIQUE INDEX "time_entries_one_open" ON "taim"."time_entries"("staffId") WHERE "clockOut" IS NULL;
-- A person's entries never overlap (an open one runs to infinity)
ALTER TABLE "taim"."time_entries" ADD CONSTRAINT "time_entries_no_overlap"
    EXCLUDE USING gist ("staffId" public.gist_int4_ops WITH =, tsrange("clockIn", "clockOut", '[)') WITH &&);

-- A break ends after it starts; one open break per entry; breaks don't overlap
ALTER TABLE "taim"."time_breaks" ADD CONSTRAINT "time_breaks_times" CHECK ("endAt" IS NULL OR "endAt" > "startAt");
CREATE UNIQUE INDEX "time_breaks_one_open" ON "taim"."time_breaks"("entryId") WHERE "endAt" IS NULL;
ALTER TABLE "taim"."time_breaks" ADD CONSTRAINT "time_breaks_no_overlap"
    EXCLUDE USING gist ("entryId" public.gist_int4_ops WITH =, tsrange("startAt", "endAt", '[)') WITH &&);

-- An edit always says why
ALTER TABLE "taim"."time_edits" ADD CONSTRAINT "time_edits_reason" CHECK (char_length(btrim("reason")) BETWEEN 1 AND 200);
