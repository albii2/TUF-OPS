/*
  Warnings:

  - You are about to drop the column `teamColors` on the `mockups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mockups" DROP COLUMN "teamColors",
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "secondaryColor" TEXT,
ADD COLUMN     "tertiaryColor" TEXT;
