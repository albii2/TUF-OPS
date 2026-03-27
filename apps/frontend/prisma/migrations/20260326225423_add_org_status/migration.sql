/*
  Warnings:

  - You are about to drop the column `ownerId` on the `opportunities` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `organizations` table. All the data in the column will be lost.
  - Made the column `organization_id` on table `opportunities` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'inactive', 'archived');

-- AlterTable
ALTER TABLE "opportunities" DROP COLUMN "ownerId",
ADD COLUMN     "owner_id" INTEGER,
ALTER COLUMN "organization_id" SET NOT NULL,
ALTER COLUMN "last_contact_date" SET DATA TYPE DATE,
ALTER COLUMN "next_step_due_date" SET DATA TYPE DATE,
ALTER COLUMN "close_date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "ownerId",
ADD COLUMN     "owner_id" INTEGER,
ADD COLUMN     "status" "OrganizationStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'rep';

-- CreateTable
CREATE TABLE "rep_activities" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "opportunity_id" INTEGER,
    "activity_type" TEXT NOT NULL,
    "notes" TEXT,
    "activity_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rep_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_notes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "opportunity_id" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_notes_pkey" PRIMARY KEY ("id")
);
