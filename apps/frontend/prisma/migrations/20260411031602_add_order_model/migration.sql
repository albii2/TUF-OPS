/*
  Warnings:

  - The values [admin,director,rep] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `created_at` on the `mockups` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `mockups` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `opportunities` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `zoho_account_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `managerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - Made the column `organization_id` on table `opportunities` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELED');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'DIRECTOR', 'REP');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'REP';
COMMIT;

-- DropForeignKey
ALTER TABLE "mockups" DROP CONSTRAINT "mockups_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "opportunity_events" DROP CONSTRAINT "opportunity_events_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_managerId_fkey";

-- DropIndex
DROP INDEX "opportunity_events_actor_user_id_created_at_idx";

-- DropIndex
DROP INDEX "opportunity_events_opportunity_id_created_at_idx";

-- DropIndex
DROP INDEX "organizations_zoho_account_id_key";

-- AlterTable
ALTER TABLE "mockups" DROP COLUMN "created_at",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "opportunities" DROP COLUMN "ownerId",
ADD COLUMN     "owner_id" INTEGER,
ALTER COLUMN "organization_id" SET NOT NULL,
ALTER COLUMN "probability" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "estimated_value" DROP NOT NULL,
ALTER COLUMN "estimated_value" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "ownerId",
DROP COLUMN "status",
DROP COLUMN "zoho_account_id",
ADD COLUMN     "owner_id" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
DROP COLUMN "managerId",
DROP COLUMN "password_hash",
DROP COLUMN "updated_at",
ADD COLUMN     "manager_id" INTEGER,
ALTER COLUMN "role" SET DEFAULT 'REP';

-- DropEnum
DROP TYPE "OrganizationStatus";

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "opportunity_id" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_opportunity_id_key" ON "orders"("opportunity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mockups" ADD CONSTRAINT "mockups_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
