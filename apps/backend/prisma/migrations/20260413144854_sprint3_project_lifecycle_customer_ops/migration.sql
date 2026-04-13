-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'ON_HOLD';

-- AlterTable
ALTER TABLE "installation_materials" ADD COLUMN     "model_id" INTEGER;

-- AlterTable
ALTER TABLE "maintenance_materials" ADD COLUMN     "model_id" INTEGER;

-- CreateTable
CREATE TABLE "dismantle_items" (
    "id" SERIAL NOT NULL,
    "dismantle_id" INTEGER NOT NULL,
    "asset_id" TEXT NOT NULL,
    "condition_after" "AssetCondition",
    "note" TEXT,

    CONSTRAINT "dismantle_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dismantle_items_dismantle_id_idx" ON "dismantle_items"("dismantle_id");

-- CreateIndex
CREATE INDEX "dismantle_items_asset_id_idx" ON "dismantle_items"("asset_id");

-- CreateIndex
CREATE INDEX "installation_materials_model_id_idx" ON "installation_materials"("model_id");

-- CreateIndex
CREATE INDEX "maintenance_materials_model_id_idx" ON "maintenance_materials"("model_id");

-- AddForeignKey
ALTER TABLE "installation_materials" ADD CONSTRAINT "installation_materials_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "asset_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_materials" ADD CONSTRAINT "maintenance_materials_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "asset_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dismantle_items" ADD CONSTRAINT "dismantle_items_dismantle_id_fkey" FOREIGN KEY ("dismantle_id") REFERENCES "dismantles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dismantle_items" ADD CONSTRAINT "dismantle_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
