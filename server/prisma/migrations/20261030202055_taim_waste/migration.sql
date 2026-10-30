-- CreateEnum
CREATE TYPE "taim"."LossKind" AS ENUM ('RETURN', 'WASTE');

-- AlterEnum
ALTER TYPE "taim"."DishStatus" ADD VALUE 'WASTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "taim"."ReturnReason" ADD VALUE 'CANCELLED';
ALTER TYPE "taim"."ReturnReason" ADD VALUE 'DROPPED';
ALTER TYPE "taim"."ReturnReason" ADD VALUE 'MADE_WRONG';

-- AlterTable
ALTER TABLE "taim"."item_returns" ADD COLUMN     "kind" "taim"."LossKind" NOT NULL DEFAULT 'RETURN';


-- Added by hand: waste has a waste reason, a return has a guest's reason.
-- (Compared as text: the new enum values can't be used in this migration.)
ALTER TABLE "taim"."item_returns" ADD CONSTRAINT "item_returns_reason_matches_kind"
    CHECK (("kind"::text = 'WASTE') = ("reason"::text IN ('CANCELLED', 'DROPPED', 'MADE_WRONG')));
