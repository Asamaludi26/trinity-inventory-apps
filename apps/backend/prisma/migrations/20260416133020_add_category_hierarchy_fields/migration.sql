-- CreateEnum
CREATE TYPE "BulkTrackingType" AS ENUM ('COUNT', 'MEASUREMENT');

-- AlterTable
ALTER TABLE "asset_categories" ADD COLUMN     "default_classification" "AssetClassification" NOT NULL DEFAULT 'ASSET',
ADD COLUMN     "is_customer_installable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_project_asset" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "asset_models" ADD COLUMN     "bulk_type" "BulkTrackingType",
ADD COLUMN     "is_installation_template" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "asset_types" ADD COLUMN     "classification" "AssetClassification",
ADD COLUMN     "tracking_method" "TrackingMethod",
ADD COLUMN     "unit_of_measure" VARCHAR(20);

-- CreateTable
CREATE TABLE "category_divisions" (
    "category_id" INTEGER NOT NULL,
    "division_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_divisions_pkey" PRIMARY KEY ("category_id","division_id")
);

-- CreateIndex
CREATE INDEX "category_divisions_division_id_idx" ON "category_divisions"("division_id");

-- AddForeignKey
ALTER TABLE "category_divisions" ADD CONSTRAINT "category_divisions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_divisions" ADD CONSTRAINT "category_divisions_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
