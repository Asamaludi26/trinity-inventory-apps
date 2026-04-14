-- CreateEnum
CREATE TYPE "RequestItemStatus" AS ENUM ('APPROVED', 'PARTIAL', 'STOCK_ALLOCATED', 'PROCUREMENT_NEEDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RepairCategory" AS ENUM ('REPAIR', 'LOST');

-- AlterTable
ALTER TABLE "asset_returns" ADD COLUMN     "rejection_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "repairs" ADD COLUMN     "category" "RepairCategory" NOT NULL DEFAULT 'REPAIR';

-- AlterTable
ALTER TABLE "request_items" ADD COLUMN     "item_reason" TEXT,
ADD COLUMN     "item_status" "RequestItemStatus";
