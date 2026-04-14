/*
  Warnings:

  - The values [IN,OUT] on the enum `MovementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AssetClassification" AS ENUM ('ASSET', 'MATERIAL');

-- CreateEnum
CREATE TYPE "TrackingMethod" AS ENUM ('INDIVIDUAL', 'COUNT', 'MEASUREMENT');

-- AlterEnum
BEGIN;
CREATE TYPE "MovementType_new" AS ENUM ('NEW_STOCK', 'HANDOVER', 'LOAN_OUT', 'LOAN_RETURN', 'INSTALLATION', 'MAINTENANCE', 'DISMANTLE_RETURN', 'REPAIR', 'ADJUSTMENT', 'CONSUMED', 'TRANSFER');
ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "MovementType_new" USING ("type"::text::"MovementType_new");
ALTER TYPE "MovementType" RENAME TO "MovementType_old";
ALTER TYPE "MovementType_new" RENAME TO "MovementType";
DROP TYPE "public"."MovementType_old";
COMMIT;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "classification" "AssetClassification" NOT NULL DEFAULT 'ASSET',
ADD COLUMN     "current_balance" DECIMAL(15,2),
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "trackingMethod" "TrackingMethod";
