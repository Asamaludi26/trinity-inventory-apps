-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN_LOGISTIK', 'ADMIN_PURCHASE', 'LEADER', 'STAFF');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('IN_STORAGE', 'IN_USE', 'IN_CUSTODY', 'UNDER_REPAIR', 'OUT_FOR_REPAIR', 'DAMAGED', 'LOST', 'DECOMMISSIONED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN');

-- CreateEnum
CREATE TYPE "DepreciationMethod" AS ENUM ('STRAIGHT_LINE', 'DECLINING_BALANCE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'LOGISTIC_APPROVED', 'AWAITING_CEO_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'PURCHASING', 'IN_DELIVERY', 'ARRIVED', 'AWAITING_HANDOVER', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'APPROVAL_REQUIRED', 'STATUS_CHANGE', 'REMINDER');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_types" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_models" (
    "id" SERIAL NOT NULL,
    "type_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "brand" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category_id" INTEGER NOT NULL,
    "type_id" INTEGER,
    "model_id" INTEGER,
    "brand" VARCHAR(255) NOT NULL,
    "serial_number" VARCHAR(255),
    "purchase_price" DECIMAL(15,2),
    "purchase_date" DATE,
    "depreciation_method" "DepreciationMethod",
    "useful_life_years" INTEGER,
    "salvage_value" DECIMAL(15,2),
    "status" "AssetStatus" NOT NULL DEFAULT 'IN_STORAGE',
    "condition" "AssetCondition" NOT NULL DEFAULT 'NEW',
    "current_user_id" INTEGER,
    "recorded_by_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_registrations" (
    "id" SERIAL NOT NULL,
    "request_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "registered_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "employee_id" VARCHAR(20) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "division_id" INTEGER,
    "permissions" JSONB,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "description" TEXT,
    "can_do_fieldwork" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "pic_name" VARCHAR(255),
    "pic_phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installations" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "location" TEXT,
    "note" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_materials" (
    "id" SERIAL NOT NULL,
    "installation_id" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "installation_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenances" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "issue_report" TEXT,
    "resolution" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_materials" (
    "id" SERIAL NOT NULL,
    "maintenance_id" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "maintenance_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_replacements" (
    "id" SERIAL NOT NULL,
    "maintenance_id" INTEGER NOT NULL,
    "old_asset_desc" VARCHAR(255) NOT NULL,
    "new_asset_desc" VARCHAR(255) NOT NULL,
    "note" TEXT,

    CONSTRAINT "maintenance_replacements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dismantles" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "reason" TEXT,
    "note" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dismantles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_projects" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "start_date" DATE,
    "end_date" DATE,
    "location" VARCHAR(500),
    "customer_id" INTEGER,
    "created_by_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infra_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_project_tasks" (
    "id" SERIAL NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'TODO',
    "assignee_id" INTEGER,
    "due_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infra_project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_project_materials" (
    "id" SERIAL NOT NULL,
    "project_id" TEXT NOT NULL,
    "model_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infra_project_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infra_project_team_members" (
    "id" SERIAL NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infra_project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_master_data" (
    "id" TEXT NOT NULL,
    "model_id" INTEGER NOT NULL,
    "supplier" VARCHAR(255) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "purchase_date" DATE NOT NULL,
    "warranty_months" INTEGER,
    "invoice_number" VARCHAR(100),
    "note" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_master_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depreciations" (
    "id" TEXT NOT NULL,
    "purchase_id" TEXT NOT NULL,
    "method" "DepreciationMethod" NOT NULL,
    "useful_life_years" INTEGER NOT NULL,
    "salvage_value" DECIMAL(15,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "depreciations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_thresholds" (
    "id" SERIAL NOT NULL,
    "model_id" INTEGER NOT NULL,
    "min_quantity" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "asset_id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reference" VARCHAR(255),
    "note" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "uploaded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(50) NOT NULL,
    "data_before" JSONB,
    "data_after" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "project_id" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "approval_chain" JSONB,
    "rejection_reason" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_items" (
    "id" SERIAL NOT NULL,
    "request_id" TEXT NOT NULL,
    "model_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_requests" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "expected_return" DATE,
    "created_by_id" INTEGER NOT NULL,
    "approval_chain" JSONB,
    "rejection_reason" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_items" (
    "id" SERIAL NOT NULL,
    "loan_request_id" TEXT NOT NULL,
    "model_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "loan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_asset_assignments" (
    "id" SERIAL NOT NULL,
    "loan_request_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_returns" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "loan_request_id" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_return_items" (
    "id" SERIAL NOT NULL,
    "return_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "condition_before" "AssetCondition" NOT NULL,
    "condition_after" "AssetCondition" NOT NULL,
    "note" TEXT,

    CONSTRAINT "asset_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handovers" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "from_user_id" INTEGER NOT NULL,
    "to_user_id" INTEGER NOT NULL,
    "witness_user_id" INTEGER,
    "note" TEXT,
    "approval_chain" JSONB,
    "rejection_reason" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_items" (
    "id" SERIAL NOT NULL,
    "handover_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "handover_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repairs" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "asset_id" TEXT NOT NULL,
    "issue_description" TEXT NOT NULL,
    "condition" "AssetCondition" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "repair_action" TEXT,
    "repair_vendor" VARCHAR(255),
    "repair_cost" DECIMAL(15,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "note" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "approval_chain" JSONB,
    "rejection_reason" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repairs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_name_key" ON "asset_categories"("name");

-- CreateIndex
CREATE INDEX "asset_types_name_idx" ON "asset_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_category_id_name_key" ON "asset_types"("category_id", "name");

-- CreateIndex
CREATE INDEX "asset_models_brand_idx" ON "asset_models"("brand");

-- CreateIndex
CREATE INDEX "asset_models_name_idx" ON "asset_models"("name");

-- CreateIndex
CREATE UNIQUE INDEX "asset_models_type_id_name_brand_key" ON "asset_models"("type_id", "name", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");

-- CreateIndex
CREATE INDEX "assets_status_category_id_idx" ON "assets"("status", "category_id");

-- CreateIndex
CREATE INDEX "assets_serial_number_idx" ON "assets"("serial_number");

-- CreateIndex
CREATE INDEX "assets_current_user_id_idx" ON "assets"("current_user_id");

-- CreateIndex
CREATE INDEX "assets_code_idx" ON "assets"("code");

-- CreateIndex
CREATE INDEX "assets_version_idx" ON "assets"("version");

-- CreateIndex
CREATE INDEX "asset_registrations_request_id_idx" ON "asset_registrations"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_division_id_idx" ON "users"("division_id");

-- CreateIndex
CREATE INDEX "users_is_active_is_deleted_idx" ON "users"("is_active", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_uuid_key" ON "divisions"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_name_key" ON "divisions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_code_key" ON "divisions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_uuid_key" ON "customers"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_key" ON "customers"("code");

-- CreateIndex
CREATE INDEX "customers_code_idx" ON "customers"("code");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "installations_code_key" ON "installations"("code");

-- CreateIndex
CREATE INDEX "installations_customer_id_idx" ON "installations"("customer_id");

-- CreateIndex
CREATE INDEX "installations_status_idx" ON "installations"("status");

-- CreateIndex
CREATE INDEX "installations_code_idx" ON "installations"("code");

-- CreateIndex
CREATE INDEX "installation_materials_installation_id_idx" ON "installation_materials"("installation_id");

-- CreateIndex
CREATE UNIQUE INDEX "maintenances_code_key" ON "maintenances"("code");

-- CreateIndex
CREATE INDEX "maintenances_customer_id_idx" ON "maintenances"("customer_id");

-- CreateIndex
CREATE INDEX "maintenances_status_idx" ON "maintenances"("status");

-- CreateIndex
CREATE INDEX "maintenances_code_idx" ON "maintenances"("code");

-- CreateIndex
CREATE INDEX "maintenance_materials_maintenance_id_idx" ON "maintenance_materials"("maintenance_id");

-- CreateIndex
CREATE INDEX "maintenance_replacements_maintenance_id_idx" ON "maintenance_replacements"("maintenance_id");

-- CreateIndex
CREATE UNIQUE INDEX "dismantles_code_key" ON "dismantles"("code");

-- CreateIndex
CREATE INDEX "dismantles_customer_id_idx" ON "dismantles"("customer_id");

-- CreateIndex
CREATE INDEX "dismantles_status_idx" ON "dismantles"("status");

-- CreateIndex
CREATE INDEX "dismantles_code_idx" ON "dismantles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "infra_projects_code_key" ON "infra_projects"("code");

-- CreateIndex
CREATE INDEX "infra_projects_status_idx" ON "infra_projects"("status");

-- CreateIndex
CREATE INDEX "infra_projects_customer_id_idx" ON "infra_projects"("customer_id");

-- CreateIndex
CREATE INDEX "infra_projects_code_idx" ON "infra_projects"("code");

-- CreateIndex
CREATE INDEX "infra_project_tasks_project_id_idx" ON "infra_project_tasks"("project_id");

-- CreateIndex
CREATE INDEX "infra_project_tasks_status_idx" ON "infra_project_tasks"("status");

-- CreateIndex
CREATE INDEX "infra_project_materials_project_id_idx" ON "infra_project_materials"("project_id");

-- CreateIndex
CREATE INDEX "infra_project_team_members_user_id_idx" ON "infra_project_team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "infra_project_team_members_project_id_user_id_key" ON "infra_project_team_members"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_master_data_model_id_key" ON "purchase_master_data"("model_id");

-- CreateIndex
CREATE INDEX "purchase_master_data_supplier_idx" ON "purchase_master_data"("supplier");

-- CreateIndex
CREATE INDEX "purchase_master_data_purchase_date_idx" ON "purchase_master_data"("purchase_date");

-- CreateIndex
CREATE UNIQUE INDEX "depreciations_purchase_id_key" ON "depreciations"("purchase_id");

-- CreateIndex
CREATE INDEX "depreciations_method_idx" ON "depreciations"("method");

-- CreateIndex
CREATE UNIQUE INDEX "stock_thresholds_model_id_key" ON "stock_thresholds"("model_id");

-- CreateIndex
CREATE INDEX "stock_movements_asset_id_idx" ON "stock_movements"("asset_id");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "attachments_entity_type_entity_id_idx" ON "attachments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "requests_code_key" ON "requests"("code");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_created_by_id_idx" ON "requests"("created_by_id");

-- CreateIndex
CREATE INDEX "requests_code_idx" ON "requests"("code");

-- CreateIndex
CREATE INDEX "requests_created_at_idx" ON "requests"("created_at");

-- CreateIndex
CREATE INDEX "request_items_request_id_idx" ON "request_items"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_requests_code_key" ON "loan_requests"("code");

-- CreateIndex
CREATE INDEX "loan_requests_status_idx" ON "loan_requests"("status");

-- CreateIndex
CREATE INDEX "loan_requests_created_by_id_idx" ON "loan_requests"("created_by_id");

-- CreateIndex
CREATE INDEX "loan_requests_code_idx" ON "loan_requests"("code");

-- CreateIndex
CREATE INDEX "loan_items_loan_request_id_idx" ON "loan_items"("loan_request_id");

-- CreateIndex
CREATE INDEX "loan_asset_assignments_asset_id_idx" ON "loan_asset_assignments"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_asset_assignments_loan_request_id_asset_id_key" ON "loan_asset_assignments"("loan_request_id", "asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_returns_code_key" ON "asset_returns"("code");

-- CreateIndex
CREATE INDEX "asset_returns_loan_request_id_idx" ON "asset_returns"("loan_request_id");

-- CreateIndex
CREATE INDEX "asset_returns_status_idx" ON "asset_returns"("status");

-- CreateIndex
CREATE INDEX "asset_returns_code_idx" ON "asset_returns"("code");

-- CreateIndex
CREATE INDEX "asset_return_items_return_id_idx" ON "asset_return_items"("return_id");

-- CreateIndex
CREATE INDEX "asset_return_items_asset_id_idx" ON "asset_return_items"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "handovers_code_key" ON "handovers"("code");

-- CreateIndex
CREATE INDEX "handovers_status_idx" ON "handovers"("status");

-- CreateIndex
CREATE INDEX "handovers_from_user_id_idx" ON "handovers"("from_user_id");

-- CreateIndex
CREATE INDEX "handovers_to_user_id_idx" ON "handovers"("to_user_id");

-- CreateIndex
CREATE INDEX "handovers_code_idx" ON "handovers"("code");

-- CreateIndex
CREATE INDEX "handover_items_handover_id_idx" ON "handover_items"("handover_id");

-- CreateIndex
CREATE INDEX "handover_items_asset_id_idx" ON "handover_items"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "repairs_code_key" ON "repairs"("code");

-- CreateIndex
CREATE INDEX "repairs_status_idx" ON "repairs"("status");

-- CreateIndex
CREATE INDEX "repairs_asset_id_idx" ON "repairs"("asset_id");

-- CreateIndex
CREATE INDEX "repairs_created_by_id_idx" ON "repairs"("created_by_id");

-- CreateIndex
CREATE INDEX "repairs_code_idx" ON "repairs"("code");

-- CreateIndex
CREATE INDEX "repairs_created_at_idx" ON "repairs"("created_at");

-- AddForeignKey
ALTER TABLE "asset_types" ADD CONSTRAINT "asset_types_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_models" ADD CONSTRAINT "asset_models_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "asset_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "asset_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "asset_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_current_user_id_fkey" FOREIGN KEY ("current_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_registrations" ADD CONSTRAINT "asset_registrations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installations" ADD CONSTRAINT "installations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_materials" ADD CONSTRAINT "installation_materials_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenances" ADD CONSTRAINT "maintenances_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_materials" ADD CONSTRAINT "maintenance_materials_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_replacements" ADD CONSTRAINT "maintenance_replacements_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "maintenances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dismantles" ADD CONSTRAINT "dismantles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_projects" ADD CONSTRAINT "infra_projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_project_tasks" ADD CONSTRAINT "infra_project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "infra_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_project_materials" ADD CONSTRAINT "infra_project_materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "infra_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infra_project_team_members" ADD CONSTRAINT "infra_project_team_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "infra_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_master_data" ADD CONSTRAINT "purchase_master_data_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "asset_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_master_data" ADD CONSTRAINT "purchase_master_data_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciations" ADD CONSTRAINT "depreciations_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchase_master_data"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depreciations" ADD CONSTRAINT "depreciations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_thresholds" ADD CONSTRAINT "stock_thresholds_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "asset_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_thresholds" ADD CONSTRAINT "stock_thresholds_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "infra_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_items" ADD CONSTRAINT "request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_requests" ADD CONSTRAINT "loan_requests_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_items" ADD CONSTRAINT "loan_items_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_asset_assignments" ADD CONSTRAINT "loan_asset_assignments_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_asset_assignments" ADD CONSTRAINT "loan_asset_assignments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_returns" ADD CONSTRAINT "asset_returns_loan_request_id_fkey" FOREIGN KEY ("loan_request_id") REFERENCES "loan_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_returns" ADD CONSTRAINT "asset_returns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_return_items" ADD CONSTRAINT "asset_return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "asset_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_return_items" ADD CONSTRAINT "asset_return_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handovers" ADD CONSTRAINT "handovers_witness_user_id_fkey" FOREIGN KEY ("witness_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_items" ADD CONSTRAINT "handover_items_handover_id_fkey" FOREIGN KEY ("handover_id") REFERENCES "handovers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_items" ADD CONSTRAINT "handover_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repairs" ADD CONSTRAINT "repairs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
