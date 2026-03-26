/*
  Warnings:

  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FundraisingPayout` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Invoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Mockup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MockupVersion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Opportunity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OpportunityNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrdersRaw` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMaster` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RepActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RosterRow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RosterUpload` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SampleRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoreProductPricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamAsset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamStore` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UniformOrder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UniformOrderLine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "FundraisingPayout" DROP CONSTRAINT "FundraisingPayout_team_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "Mockup" DROP CONSTRAINT "Mockup_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "MockupVersion" DROP CONSTRAINT "MockupVersion_mockup_id_fkey";

-- DropForeignKey
ALTER TABLE "Opportunity" DROP CONSTRAINT "Opportunity_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "Opportunity" DROP CONSTRAINT "Opportunity_team_id_fkey";

-- DropForeignKey
ALTER TABLE "OpportunityNote" DROP CONSTRAINT "OpportunityNote_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "OpportunityNote" DROP CONSTRAINT "OpportunityNote_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_raw_order_id_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_order_id_fkey";

-- DropForeignKey
ALTER TABLE "RepActivity" DROP CONSTRAINT "RepActivity_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "RepActivity" DROP CONSTRAINT "RepActivity_user_id_fkey";

-- DropForeignKey
ALTER TABLE "RosterRow" DROP CONSTRAINT "RosterRow_roster_upload_id_fkey";

-- DropForeignKey
ALTER TABLE "RosterUpload" DROP CONSTRAINT "RosterUpload_uniform_order_id_fkey";

-- DropForeignKey
ALTER TABLE "SampleRequest" DROP CONSTRAINT "SampleRequest_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "StoreProductPricing" DROP CONSTRAINT "StoreProductPricing_product_id_fkey";

-- DropForeignKey
ALTER TABLE "StoreProductPricing" DROP CONSTRAINT "StoreProductPricing_team_store_id_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamAsset" DROP CONSTRAINT "TeamAsset_team_id_fkey";

-- DropForeignKey
ALTER TABLE "TeamStore" DROP CONSTRAINT "TeamStore_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "UniformOrder" DROP CONSTRAINT "UniformOrder_opportunity_id_fkey";

-- DropForeignKey
ALTER TABLE "UniformOrderLine" DROP CONSTRAINT "UniformOrderLine_product_id_fkey";

-- DropForeignKey
ALTER TABLE "UniformOrderLine" DROP CONSTRAINT "UniformOrderLine_uniform_order_id_fkey";

-- DropTable
DROP TABLE "Contact";

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "FundraisingPayout";

-- DropTable
DROP TABLE "Invoice";

-- DropTable
DROP TABLE "Mockup";

-- DropTable
DROP TABLE "MockupVersion";

-- DropTable
DROP TABLE "Opportunity";

-- DropTable
DROP TABLE "OpportunityNote";

-- DropTable
DROP TABLE "Order";

-- DropTable
DROP TABLE "OrderItem";

-- DropTable
DROP TABLE "OrdersRaw";

-- DropTable
DROP TABLE "Organization";

-- DropTable
DROP TABLE "ProductMaster";

-- DropTable
DROP TABLE "RepActivity";

-- DropTable
DROP TABLE "RosterRow";

-- DropTable
DROP TABLE "RosterUpload";

-- DropTable
DROP TABLE "SampleRequest";

-- DropTable
DROP TABLE "StoreProductPricing";

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "TeamAsset";

-- DropTable
DROP TABLE "TeamStore";

-- DropTable
DROP TABLE "UniformOrder";

-- DropTable
DROP TABLE "UniformOrderLine";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER,
    "zoho_account_id" TEXT,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "ownerId" INTEGER,
    "last_contact_date" TIMESTAMP(3),
    "probability" INTEGER,
    "estimated_value" DECIMAL(10,2),
    "next_step" TEXT,
    "next_step_due_date" TIMESTAMP(3),
    "close_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "zoho_deal_id" TEXT,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_zoho_account_id_key" ON "organizations"("zoho_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_zoho_deal_id_key" ON "opportunities"("zoho_deal_id");
