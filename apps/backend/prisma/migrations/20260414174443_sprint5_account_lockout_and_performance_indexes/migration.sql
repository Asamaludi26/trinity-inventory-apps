-- DropIndex
DROP INDEX "assets_version_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "assets_status_model_id_idx" ON "assets"("status", "model_id");

-- CreateIndex
CREATE INDEX "assets_status_current_user_id_idx" ON "assets"("status", "current_user_id");

-- CreateIndex
CREATE INDEX "assets_is_deleted_status_idx" ON "assets"("is_deleted", "status");

-- CreateIndex
CREATE INDEX "assets_created_at_idx" ON "assets"("created_at");

-- CreateIndex
CREATE INDEX "customers_is_active_is_deleted_idx" ON "customers"("is_active", "is_deleted");

-- CreateIndex
CREATE INDEX "loan_requests_status_created_by_id_idx" ON "loan_requests"("status", "created_by_id");

-- CreateIndex
CREATE INDEX "loan_requests_is_deleted_status_idx" ON "loan_requests"("is_deleted", "status");

-- CreateIndex
CREATE INDEX "requests_status_created_by_id_idx" ON "requests"("status", "created_by_id");

-- CreateIndex
CREATE INDEX "requests_is_deleted_status_idx" ON "requests"("is_deleted", "status");

-- CreateIndex
CREATE INDEX "stock_movements_asset_id_type_idx" ON "stock_movements"("asset_id", "type");

-- CreateIndex
CREATE INDEX "stock_movements_asset_id_created_at_idx" ON "stock_movements"("asset_id", "created_at");
