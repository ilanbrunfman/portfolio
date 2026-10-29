-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "taim";

-- CreateEnum
CREATE TYPE "taim"."StaffRole" AS ENUM ('MANAGER', 'CHEF', 'COOK', 'HOST', 'WAITER');

-- CreateTable
CREATE TABLE "taim"."staff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" "taim"."StaffRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);
