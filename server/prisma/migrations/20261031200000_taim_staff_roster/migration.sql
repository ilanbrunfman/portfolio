-- AlterTable
ALTER TABLE "taim"."seat_allergies" ALTER COLUMN "allergens" DROP DEFAULT;

-- AlterTable
ALTER TABLE "taim"."staff" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "demoPin" TEXT,
ADD COLUMN     "failedPins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hourlyRate" INTEGER,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pinHash" TEXT,
ADD COLUMN     "startDate" DATE;

-- CreateTable
CREATE TABLE "taim"."staff_sessions" (
    "id" TEXT NOT NULL,
    "staffId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_sessions_staffId_idx" ON "taim"."staff_sessions"("staffId");

-- AddForeignKey
ALTER TABLE "taim"."staff_sessions" ADD CONSTRAINT "staff_sessions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "taim"."staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Hand-written rules (step 8.1):
-- a name isn't empty; a rate isn't negative; a demo PIN is 4 digits; wrong tries never go below 0
ALTER TABLE "taim"."staff" ADD CONSTRAINT "staff_valid" CHECK (
    char_length(btrim("name")) > 0
    AND ("hourlyRate" IS NULL OR "hourlyRate" >= 0)
    AND ("demoPin" IS NULL OR "demoPin" ~ '^[0-9]{4}$')
    AND "failedPins" >= 0
);
