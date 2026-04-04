/*
  Warnings:

  - You are about to drop the column `organization_id` on the `opportunities` table. All the data in the column will be lost.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'ASSIGNED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Pending', 'AwaitingMockup', 'MockupApproved', 'AwaitingSample', 'SampleDelivered', 'AwaitingRoster', 'RosterConfirmed', 'AwaitingPayment', 'InProduction', 'Shipped', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "MockupRequestStatus" AS ENUM ('Requested', 'InProgress', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "SampleRequestStatus" AS ENUM ('Requested', 'Ordered', 'Shipped', 'Delivered', 'Completed');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'director', 'rep');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING');

-- AlterTable
ALTER TABLE "opportunities" DROP COLUMN "organization_id",
ADD COLUMN     "program_id" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "image" TEXT,
ADD COLUMN     "managerId" INTEGER,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'rep';

-- DropTable
DROP TABLE "organizations";

-- DropEnum
DROP TYPE "OrganizationStatus";

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "contactName" TEXT,
    "contactInfo" TEXT,
    "sport" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedToId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uniform_orders" (
    "id" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'Pending',
    "opportunityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uniform_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mockup_requests" (
    "id" TEXT NOT NULL,
    "status" "MockupRequestStatus" NOT NULL DEFAULT 'Requested',
    "notes" TEXT,
    "jerseyNumber" TEXT,
    "logo" TEXT,
    "colors" TEXT,
    "opportunityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mockup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_requests" (
    "id" TEXT NOT NULL,
    "status" "SampleRequestStatus" NOT NULL DEFAULT 'Requested',
    "notes" TEXT,
    "trackingNumber" TEXT,
    "playerName" TEXT,
    "playerNumber" TEXT,
    "size" TEXT,
    "opportunityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sample_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_uploads" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "rosterData" JSONB,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roster_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "customerName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "streetAddress" TEXT,
    "customerPhone" TEXT,
    "paymentTerms" TEXT,
    "salesperson" TEXT,
    "orderType" TEXT,
    "opportunityId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER,
    "zoho_account_id" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "programId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "type" "ActivityType" NOT NULL,
    "notes" TEXT NOT NULL,
    "opportunityId" INTEGER NOT NULL,
    "contactId" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roster_uploads_orderId_key" ON "roster_uploads"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_opportunityId_key" ON "invoices"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "programs_zoho_account_id_key" ON "programs"("zoho_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uniform_orders" ADD CONSTRAINT "uniform_orders_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mockup_requests" ADD CONSTRAINT "mockup_requests_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roster_uploads" ADD CONSTRAINT "roster_uploads_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "uniform_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
