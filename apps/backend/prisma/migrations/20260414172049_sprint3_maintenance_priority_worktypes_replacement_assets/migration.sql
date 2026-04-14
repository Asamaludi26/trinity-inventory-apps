-- AlterTable
ALTER TABLE "maintenance_replacements" ADD COLUMN     "condition_after" "AssetCondition",
ADD COLUMN     "new_asset_id" TEXT,
ADD COLUMN     "old_asset_id" TEXT;

-- AlterTable
ALTER TABLE "maintenances" ADD COLUMN     "priority" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "work_types" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "maintenance_replacements_old_asset_id_idx" ON "maintenance_replacements"("old_asset_id");

-- CreateIndex
CREATE INDEX "maintenance_replacements_new_asset_id_idx" ON "maintenance_replacements"("new_asset_id");

-- AddForeignKey
ALTER TABLE "maintenance_replacements" ADD CONSTRAINT "maintenance_replacements_old_asset_id_fkey" FOREIGN KEY ("old_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_replacements" ADD CONSTRAINT "maintenance_replacements_new_asset_id_fkey" FOREIGN KEY ("new_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
