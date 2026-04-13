-- AlterTable
ALTER TABLE "asset_returns" ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
