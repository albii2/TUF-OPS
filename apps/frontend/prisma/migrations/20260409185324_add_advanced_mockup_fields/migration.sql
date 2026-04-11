/*
  Warnings:

  - A unique constraint covering the columns `[trelloCardId]` on the table `mockups` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "mockups" ADD COLUMN     "jerseyNumbers" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "teamColors" TEXT,
ADD COLUMN     "trelloCardId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mockups_trelloCardId_key" ON "mockups"("trelloCardId");
