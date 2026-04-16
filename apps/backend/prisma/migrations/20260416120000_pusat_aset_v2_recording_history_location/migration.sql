-- CreateEnum
CREATE TYPE "RecordingSource" AS ENUM ('REQUEST', 'MANUAL');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "location" VARCHAR(255),
ADD COLUMN     "location_detail" VARCHAR(500),
ADD COLUMN     "location_note" TEXT,
ADD COLUMN     "mac_address" VARCHAR(17),
ADD COLUMN     "note" TEXT,
ADD COLUMN     "recording_id" INTEGER,
ADD COLUMN     "recording_source" "RecordingSource" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "stock_thresholds" ADD COLUMN     "warning_quantity" INTEGER;

-- CreateTable
CREATE TABLE "asset_recordings" (
    "id" SERIAL NOT NULL,
    "doc_number" VARCHAR(50) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_id" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_history" (
    "id" SERIAL NOT NULL,
    "asset_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "field" VARCHAR(100),
    "old_value" TEXT,
    "new_value" TEXT,
    "note" TEXT,
    "changed_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_recordings_doc_number_key" ON "asset_recordings"("doc_number");

-- CreateIndex
CREATE INDEX "asset_recordings_doc_number_idx" ON "asset_recordings"("doc_number");

-- CreateIndex
CREATE INDEX "asset_recordings_recorded_at_idx" ON "asset_recordings"("recorded_at");

-- CreateIndex
CREATE INDEX "asset_history_asset_id_idx" ON "asset_history"("asset_id");

-- CreateIndex
CREATE INDEX "asset_history_asset_id_created_at_idx" ON "asset_history"("asset_id", "created_at");

-- CreateIndex
CREATE INDEX "asset_history_action_idx" ON "asset_history"("action");

-- CreateIndex
CREATE INDEX "assets_recording_id_idx" ON "assets"("recording_id");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "asset_recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_recordings" ADD CONSTRAINT "asset_recordings_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_history" ADD CONSTRAINT "asset_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
