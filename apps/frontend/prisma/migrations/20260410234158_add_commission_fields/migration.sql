-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('UNIFORMS', 'TEAM_STORES', 'LETTERMAN_JACKETS');

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "cost_of_goods_sold" DECIMAL(10,2),
ADD COLUMN     "deal_type" "DealType",
ADD COLUMN     "gross_profit" DECIMAL(10,2);
