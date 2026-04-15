-- AlterTable: Add unit conversion fields to asset_models
ALTER TABLE "asset_models" ADD COLUMN "unit" VARCHAR(20),
ADD COLUMN "container_unit" VARCHAR(20),
ADD COLUMN "container_size" DECIMAL(15,2);

-- AlterTable: Add version (OCC) to customer operation tables
ALTER TABLE "installations" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "maintenances" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "dismantles" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
