/*
  Warnings:

  - You are about to drop the column `owner_id` on the `opportunities` table. All the data in the column will be lost.
  - The `stage` column on the `opportunities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `owner_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the `opportunity_notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rep_activities` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `estimated_value` on table `opportunities` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('lead', 'contacted', 'mockup', 'sample', 'invoice', 'closed_won', 'closed_lost');

-- AlterTable
ALTER TABLE "opportunities" DROP COLUMN "owner_id",
ADD COLUMN     "ownerId" INTEGER,
ALTER COLUMN "organization_id" DROP NOT NULL,
DROP COLUMN "stage",
ADD COLUMN     "stage" "OpportunityStage" NOT NULL DEFAULT 'lead',
ALTER COLUMN "last_contact_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "estimated_value" SET NOT NULL,
ALTER COLUMN "estimated_value" SET DEFAULT 0,
ALTER COLUMN "next_step_due_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "close_date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "owner_id",
ADD COLUMN     "ownerId" INTEGER;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

-- DropTable
DROP TABLE "opportunity_notes";

-- DropTable
DROP TABLE "rep_activities";
