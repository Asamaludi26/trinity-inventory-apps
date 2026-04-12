import 'dotenv/config';
import {
  PrismaClient,
  UserRole,
  AssetStatus,
  AssetCondition,
  DepreciationMethod,
  TransactionStatus,
  MovementType,
  NotificationType,
} from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? '';
  if (url.startsWith('prisma+postgres://')) {
    const apiKey = new URL(
      url.replace('prisma+postgres://', 'http://'),
    ).searchParams.get('api_key');
    if (apiKey) {
      const decoded = JSON.parse(
        Buffer.from(apiKey, 'base64').toString('utf-8'),
      );
      return decoded.databaseUrl;
    }
  }
  return url;
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

// ================================================================
// Helper types
// ================================================================
interface ModelRef {
  id: number;
  typeId: number;
  name: string;
  brand: string;
}

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================================
  // 1. DIVISIONS (PRD 7.1)
  // ============================================================
  const divisionsData = [
    { name: 'Teknisi', code: 'TEK', canDoFieldwork: true },
    { name: 'Logistik', code: 'LOG', canDoFieldwork: false },
    { name: 'Purchasing', code: 'PUR', canDoFieldwork: false },
    { name: 'Management', code: 'MGT', canDoFieldwork: false },
  ];

  for (const div of divisionsData) {
    await prisma.division.upsert({
      where: { code: div.code },
      update: {},
      create: div,
    });
  }
  console.log('✅ Divisions seeded');

  const divTek = await prisma.division.findUniqueOrThrow({
    where: { code: 'TEK' },
  });
  const divLog = await prisma.division.findUniqueOrThrow({
    where: { code: 'LOG' },
  });
  const divPur = await prisma.division.findUniqueOrThrow({
    where: { code: 'PUR' },
  });
  const divMgt = await prisma.division.findUniqueOrThrow({
    where: { code: 'MGT' },
  });

  // ============================================================
  // 2. USERS — Satu per role (PRD 7.1)
  //    SUPERADMIN, ADMIN_LOGISTIK, ADMIN_PURCHASE, LEADER, STAFF
  // ============================================================
  const hashedPassword = await bcrypt.hash('SuperAdmin@2026', 12);

  const usersData = [
    {
      employeeId: 'EMP-001',
      fullName: 'Super Admin',
      email: 'superadmin@trinity.local',
      password: hashedPassword,
      role: UserRole.SUPERADMIN,
      divisionId: divMgt.id,
      phone: '081200000001',
    },
    {
      employeeId: 'EMP-002',
      fullName: 'Admin Logistik',
      email: 'logistik@trinity.local',
      password: hashedPassword,
      role: UserRole.ADMIN_LOGISTIK,
      divisionId: divLog.id,
      phone: '081200000002',
    },
    {
      employeeId: 'EMP-003',
      fullName: 'Admin Purchase',
      email: 'purchase@trinity.local',
      password: hashedPassword,
      role: UserRole.ADMIN_PURCHASE,
      divisionId: divPur.id,
      phone: '081200000003',
    },
    {
      employeeId: 'EMP-004',
      fullName: 'Leader Teknisi',
      email: 'leader@trinity.local',
      password: hashedPassword,
      role: UserRole.LEADER,
      divisionId: divTek.id,
      phone: '081200000004',
    },
    {
      employeeId: 'EMP-005',
      fullName: 'Staff Teknisi',
      email: 'staff@trinity.local',
      password: hashedPassword,
      role: UserRole.STAFF,
      divisionId: divTek.id,
      phone: '081200000005',
    },
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: { ...user, isActive: true },
    });
  }
  console.log('✅ Users seeded (5 roles)');

  const superadmin = await prisma.user.findUniqueOrThrow({
    where: { email: 'superadmin@trinity.local' },
  });
  const adminLogistik = await prisma.user.findUniqueOrThrow({
    where: { email: 'logistik@trinity.local' },
  });
  const adminPurchase = await prisma.user.findUniqueOrThrow({
    where: { email: 'purchase@trinity.local' },
  });
  const leader = await prisma.user.findUniqueOrThrow({
    where: { email: 'leader@trinity.local' },
  });
  const staff = await prisma.user.findUniqueOrThrow({
    where: { email: 'staff@trinity.local' },
  });

  // ============================================================
  // 3. ASSET CATEGORIES → TYPES → MODELS (PRD 5.1 B)
  //    Hirarki: Category → Type → Model (brand)
  // ============================================================
  const categoriesData = ['Device', 'Tools', 'Material Jaringan'];
  for (const name of categoriesData) {
    await prisma.assetCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const catDevice = await prisma.assetCategory.findUniqueOrThrow({
    where: { name: 'Device' },
  });
  const catTools = await prisma.assetCategory.findUniqueOrThrow({
    where: { name: 'Tools' },
  });
  const catMaterial = await prisma.assetCategory.findUniqueOrThrow({
    where: { name: 'Material Jaringan' },
  });

  const typesModelsData = [
    {
      categoryId: catDevice.id,
      typeName: 'Laptop',
      models: [
        { name: 'ThinkPad X1 Carbon Gen 11', brand: 'Lenovo' },
        { name: 'MacBook Pro 14"', brand: 'Apple' },
      ],
    },
    {
      categoryId: catDevice.id,
      typeName: 'Router',
      models: [
        { name: 'hAP ac3', brand: 'MikroTik' },
        { name: 'RB5009UG+S+IN', brand: 'MikroTik' },
      ],
    },
    {
      categoryId: catDevice.id,
      typeName: 'Switch',
      models: [{ name: 'Catalyst 1000-24T', brand: 'Cisco' }],
    },
    {
      categoryId: catTools.id,
      typeName: 'Crimping Tool',
      models: [{ name: 'RJ45 Crimper Pro', brand: 'Panduit' }],
    },
    {
      categoryId: catTools.id,
      typeName: 'Fiber Splicer',
      models: [{ name: '90S Fusion Splicer', brand: 'Fujikura' }],
    },
    {
      categoryId: catTools.id,
      typeName: 'Power Meter',
      models: [{ name: 'OPM-50', brand: 'Joinwit' }],
    },
    {
      categoryId: catMaterial.id,
      typeName: 'Kabel UTP',
      models: [{ name: 'Cat6 UTP 305m', brand: 'Belden' }],
    },
    {
      categoryId: catMaterial.id,
      typeName: 'Kabel Fiber Optic',
      models: [{ name: 'SC-SC Singlemode 100m', brand: 'Commscope' }],
    },
    {
      categoryId: catMaterial.id,
      typeName: 'Konektor',
      models: [{ name: 'RJ45 Cat6 (100pcs)', brand: 'AMP' }],
    },
  ];

  const modelMap: Record<string, ModelRef> = {};

  for (const tm of typesModelsData) {
    const type = await prisma.assetType.upsert({
      where: {
        categoryId_name: { categoryId: tm.categoryId, name: tm.typeName },
      },
      update: {},
      create: { categoryId: tm.categoryId, name: tm.typeName },
    });

    for (const m of tm.models) {
      const model = await prisma.assetModel.upsert({
        where: {
          typeId_name_brand: { typeId: type.id, name: m.name, brand: m.brand },
        },
        update: {},
        create: { typeId: type.id, name: m.name, brand: m.brand },
      });
      modelMap[`${m.brand}-${m.name}`] = {
        id: model.id,
        typeId: type.id,
        name: m.name,
        brand: m.brand,
      };
    }
  }
  console.log('✅ Asset categories, types & models seeded');

  // ============================================================
  // 4. PURCHASE MASTER DATA & DEPRECIATION (PRD 5.1 C, BR-03)
  //    1 Purchase per Model. Depresiasi opsional (material = null).
  // ============================================================
  const purchasesData = [
    {
      modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
      supplier: 'PT. Lenovo Indonesia',
      unitPrice: 22_000_000,
      quantity: 5,
      purchaseDate: new Date('2026-01-15'),
      warrantyMonths: 36,
      invoiceNumber: 'INV-LNV-2026-001',
      depreciation: {
        method: DepreciationMethod.STRAIGHT_LINE,
        usefulLifeYears: 4,
        salvageValue: 3_000_000,
      },
    },
    {
      modelKey: 'Apple-MacBook Pro 14"',
      supplier: 'PT. Apple Indonesia',
      unitPrice: 35_000_000,
      quantity: 3,
      purchaseDate: new Date('2026-02-01'),
      warrantyMonths: 12,
      invoiceNumber: 'INV-APL-2026-001',
      depreciation: {
        method: DepreciationMethod.DECLINING_BALANCE,
        usefulLifeYears: 5,
        salvageValue: 5_000_000,
      },
    },
    {
      modelKey: 'MikroTik-hAP ac3',
      supplier: 'PT. Mikrotik Indonesia',
      unitPrice: 1_500_000,
      quantity: 10,
      purchaseDate: new Date('2026-01-20'),
      warrantyMonths: 12,
      invoiceNumber: 'INV-MTK-2026-001',
      depreciation: {
        method: DepreciationMethod.STRAIGHT_LINE,
        usefulLifeYears: 5,
        salvageValue: 200_000,
      },
    },
    {
      modelKey: 'MikroTik-RB5009UG+S+IN',
      supplier: 'PT. Mikrotik Indonesia',
      unitPrice: 3_500_000,
      quantity: 5,
      purchaseDate: new Date('2026-02-10'),
      warrantyMonths: 12,
      invoiceNumber: 'INV-MTK-2026-002',
      depreciation: {
        method: DepreciationMethod.STRAIGHT_LINE,
        usefulLifeYears: 5,
        salvageValue: 500_000,
      },
    },
    {
      modelKey: 'Cisco-Catalyst 1000-24T',
      supplier: 'PT. Cisco Systems Indonesia',
      unitPrice: 8_000_000,
      quantity: 3,
      purchaseDate: new Date('2026-03-01'),
      warrantyMonths: 24,
      invoiceNumber: 'INV-CSC-2026-001',
      depreciation: {
        method: DepreciationMethod.STRAIGHT_LINE,
        usefulLifeYears: 6,
        salvageValue: 1_000_000,
      },
    },
    {
      modelKey: 'Panduit-RJ45 Crimper Pro',
      supplier: 'PT. Panduit Indonesia',
      unitPrice: 750_000,
      quantity: 5,
      purchaseDate: new Date('2026-01-10'),
      warrantyMonths: 12,
      invoiceNumber: 'INV-PND-2026-001',
      depreciation: {
        method: DepreciationMethod.STRAIGHT_LINE,
        usefulLifeYears: 3,
        salvageValue: 100_000,
      },
    },
    {
      modelKey: 'Fujikura-90S Fusion Splicer',
      supplier: 'PT. Fujikura Indonesia',
      unitPrice: 85_000_000,
      quantity: 2,
      purchaseDate: new Date('2026-02-15'),
      warrantyMonths: 24,
      invoiceNumber: 'INV-FJK-2026-001',
      depreciation: {
        method: DepreciationMethod.DECLINING_BALANCE,
        usefulLifeYears: 8,
        salvageValue: 10_000_000,
      },
    },
    {
      modelKey: 'Joinwit-OPM-50',
      supplier: 'PT. Joinwit Indonesia',
      unitPrice: 2_500_000,
      quantity: 4,
      purchaseDate: new Date('2026-01-25'),
      warrantyMonths: 12,
      invoiceNumber: 'INV-JNW-2026-001',
      depreciation: {
        method: DepreciationMethod.STRAIGHT_LINE,
        usefulLifeYears: 5,
        salvageValue: 300_000,
      },
    },
    {
      modelKey: 'Belden-Cat6 UTP 305m',
      supplier: 'PT. Belden Indonesia',
      unitPrice: 2_800_000,
      quantity: 20,
      purchaseDate: new Date('2026-01-05'),
      warrantyMonths: 0,
      invoiceNumber: 'INV-BLD-2026-001',
      depreciation: null,
    },
    {
      modelKey: 'Commscope-SC-SC Singlemode 100m',
      supplier: 'PT. Commscope Indonesia',
      unitPrice: 1_200_000,
      quantity: 15,
      purchaseDate: new Date('2026-01-05'),
      warrantyMonths: 0,
      invoiceNumber: 'INV-CMS-2026-001',
      depreciation: null,
    },
    {
      modelKey: 'AMP-RJ45 Cat6 (100pcs)',
      supplier: 'PT. TE Connectivity Indonesia',
      unitPrice: 350_000,
      quantity: 30,
      purchaseDate: new Date('2026-01-05'),
      warrantyMonths: 0,
      invoiceNumber: 'INV-AMP-2026-001',
      depreciation: null,
    },
  ];

  // Map modelKey → purchase snapshot for asset creation
  const purchaseSnapshot: Record<
    string,
    {
      unitPrice: number;
      purchaseDate: Date;
      method?: DepreciationMethod;
      usefulLifeYears?: number;
      salvageValue?: number;
    }
  > = {};

  for (const p of purchasesData) {
    const model = modelMap[p.modelKey];
    if (!model) {
      console.warn(`⚠️  Model not found: ${p.modelKey}`);
      continue;
    }

    const existing = await prisma.purchaseMasterData.findUnique({
      where: { modelId: model.id },
    });

    if (!existing) {
      const totalPrice = p.unitPrice * p.quantity;
      const purchase = await prisma.purchaseMasterData.create({
        data: {
          modelId: model.id,
          supplier: p.supplier,
          unitPrice: p.unitPrice,
          quantity: p.quantity,
          totalPrice,
          purchaseDate: p.purchaseDate,
          warrantyMonths: p.warrantyMonths,
          invoiceNumber: p.invoiceNumber,
          createdById: adminPurchase.id,
        },
      });

      if (p.depreciation) {
        await prisma.depreciation.create({
          data: {
            purchaseId: purchase.id,
            method: p.depreciation.method,
            usefulLifeYears: p.depreciation.usefulLifeYears,
            salvageValue: p.depreciation.salvageValue,
            startDate: p.purchaseDate,
            createdById: adminPurchase.id,
          },
        });
      }
    }

    // Keep snapshot for asset creation
    purchaseSnapshot[p.modelKey] = {
      unitPrice: p.unitPrice,
      purchaseDate: p.purchaseDate,
      method: p.depreciation?.method,
      usefulLifeYears: p.depreciation?.usefulLifeYears,
      salvageValue: p.depreciation?.salvageValue,
    };
  }
  console.log('✅ Purchase data & depreciation seeded');

  // ============================================================
  // 5. ASSETS & STOCK MOVEMENTS (PRD 5.1 B, BR-07, BR-08)
  //    Code format: AS-YYYY-MMDD-XXXX
  // ============================================================
  const assetsData = [
    // --- Laptops (Lenovo ThinkPad) ---
    {
      code: 'AS-2026-0115-0001',
      name: 'Laptop ThinkPad X1 #1',
      catId: catDevice.id,
      modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
      serial: 'LNV-X1C-SN001',
      status: AssetStatus.IN_USE,
      condition: AssetCondition.GOOD,
      userId: leader.id,
    },
    {
      code: 'AS-2026-0115-0002',
      name: 'Laptop ThinkPad X1 #2',
      catId: catDevice.id,
      modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
      serial: 'LNV-X1C-SN002',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },
    {
      code: 'AS-2026-0115-0003',
      name: 'Laptop ThinkPad X1 #3',
      catId: catDevice.id,
      modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
      serial: 'LNV-X1C-SN003',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },
    {
      code: 'AS-2026-0115-0004',
      name: 'Laptop ThinkPad X1 #4',
      catId: catDevice.id,
      modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
      serial: 'LNV-X1C-SN004',
      status: AssetStatus.IN_USE,
      condition: AssetCondition.GOOD,
      userId: staff.id,
    },
    {
      code: 'AS-2026-0115-0005',
      name: 'Laptop ThinkPad X1 #5',
      catId: catDevice.id,
      modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
      serial: 'LNV-X1C-SN005',
      status: AssetStatus.IN_CUSTODY,
      condition: AssetCondition.GOOD,
      userId: staff.id,
    },

    // --- Laptops (Apple MacBook) ---
    {
      code: 'AS-2026-0201-0001',
      name: 'MacBook Pro 14" #1',
      catId: catDevice.id,
      modelKey: 'Apple-MacBook Pro 14"',
      serial: 'APL-MBP-SN001',
      status: AssetStatus.IN_USE,
      condition: AssetCondition.NEW,
      userId: superadmin.id,
    },
    {
      code: 'AS-2026-0201-0002',
      name: 'MacBook Pro 14" #2',
      catId: catDevice.id,
      modelKey: 'Apple-MacBook Pro 14"',
      serial: 'APL-MBP-SN002',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },
    {
      code: 'AS-2026-0201-0003',
      name: 'MacBook Pro 14" #3',
      catId: catDevice.id,
      modelKey: 'Apple-MacBook Pro 14"',
      serial: 'APL-MBP-SN003',
      status: AssetStatus.UNDER_REPAIR,
      condition: AssetCondition.POOR,
      userId: null,
    },

    // --- Routers ---
    {
      code: 'AS-2026-0120-0001',
      name: 'Router hAP ac3 #1',
      catId: catDevice.id,
      modelKey: 'MikroTik-hAP ac3',
      serial: 'MTK-HAP-SN001',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },
    {
      code: 'AS-2026-0120-0002',
      name: 'Router hAP ac3 #2',
      catId: catDevice.id,
      modelKey: 'MikroTik-hAP ac3',
      serial: 'MTK-HAP-SN002',
      status: AssetStatus.IN_USE,
      condition: AssetCondition.GOOD,
      userId: leader.id,
    },
    {
      code: 'AS-2026-0120-0003',
      name: 'Router hAP ac3 #3',
      catId: catDevice.id,
      modelKey: 'MikroTik-hAP ac3',
      serial: 'MTK-HAP-SN003',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },

    // --- Switches ---
    {
      code: 'AS-2026-0301-0001',
      name: 'Switch Catalyst 1000 #1',
      catId: catDevice.id,
      modelKey: 'Cisco-Catalyst 1000-24T',
      serial: 'CSC-C1K-SN001',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },
    {
      code: 'AS-2026-0301-0002',
      name: 'Switch Catalyst 1000 #2',
      catId: catDevice.id,
      modelKey: 'Cisco-Catalyst 1000-24T',
      serial: 'CSC-C1K-SN002',
      status: AssetStatus.IN_USE,
      condition: AssetCondition.GOOD,
      userId: adminLogistik.id,
    },

    // --- Tools: Crimper ---
    {
      code: 'AS-2026-0110-0001',
      name: 'Crimper RJ45 #1',
      catId: catTools.id,
      modelKey: 'Panduit-RJ45 Crimper Pro',
      serial: 'PND-CRP-SN001',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.GOOD,
      userId: null,
    },
    {
      code: 'AS-2026-0110-0002',
      name: 'Crimper RJ45 #2',
      catId: catTools.id,
      modelKey: 'Panduit-RJ45 Crimper Pro',
      serial: 'PND-CRP-SN002',
      status: AssetStatus.IN_USE,
      condition: AssetCondition.GOOD,
      userId: staff.id,
    },

    // --- Tools: Fusion Splicer ---
    {
      code: 'AS-2026-0215-0001',
      name: 'Fusion Splicer 90S #1',
      catId: catTools.id,
      modelKey: 'Fujikura-90S Fusion Splicer',
      serial: 'FJK-90S-SN001',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },
    {
      code: 'AS-2026-0215-0002',
      name: 'Fusion Splicer 90S #2',
      catId: catTools.id,
      modelKey: 'Fujikura-90S Fusion Splicer',
      serial: 'FJK-90S-SN002',
      status: AssetStatus.IN_CUSTODY,
      condition: AssetCondition.GOOD,
      userId: leader.id,
    },

    // --- Tools: Power Meter ---
    {
      code: 'AS-2026-0125-0001',
      name: 'Power Meter OPM-50 #1',
      catId: catTools.id,
      modelKey: 'Joinwit-OPM-50',
      serial: 'JNW-OPM-SN001',
      status: AssetStatus.IN_USE,
      condition: AssetCondition.GOOD,
      userId: staff.id,
    },
    {
      code: 'AS-2026-0125-0002',
      name: 'Power Meter OPM-50 #2',
      catId: catTools.id,
      modelKey: 'Joinwit-OPM-50',
      serial: 'JNW-OPM-SN002',
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.NEW,
      userId: null,
    },
  ];

  const assetMap: Record<string, string> = {};

  for (const a of assetsData) {
    const model = modelMap[a.modelKey];
    if (!model) continue;

    const existing = await prisma.asset.findUnique({ where: { code: a.code } });
    if (existing) {
      assetMap[a.code] = existing.id;
      continue;
    }

    const snap = purchaseSnapshot[a.modelKey];
    const asset = await prisma.asset.create({
      data: {
        code: a.code,
        name: a.name,
        categoryId: a.catId,
        typeId: model.typeId,
        modelId: model.id,
        brand: model.brand,
        serialNumber: a.serial,
        purchasePrice: snap?.unitPrice ?? null,
        purchaseDate: snap?.purchaseDate ?? null,
        depreciationMethod: snap?.method ?? null,
        usefulLifeYears: snap?.usefulLifeYears ?? null,
        salvageValue: snap?.salvageValue ?? null,
        status: a.status,
        condition: a.condition,
        currentUserId: a.userId,
        recordedById: adminLogistik.id,
      },
    });
    assetMap[a.code] = asset.id;

    await prisma.stockMovement.create({
      data: {
        assetId: asset.id,
        type: MovementType.IN,
        quantity: 1,
        reference: 'SEED-INIT',
        note: 'Registrasi awal dari seed data',
        createdById: adminLogistik.id,
      },
    });
  }
  console.log('✅ Assets & stock movements seeded (20 assets)');

  // ============================================================
  // 6. STOCK THRESHOLDS (PRD 6.1 — Stok Aset, BR-02)
  // ============================================================
  const thresholdsData = [
    { modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11', minQuantity: 2 },
    { modelKey: 'Apple-MacBook Pro 14"', minQuantity: 1 },
    { modelKey: 'MikroTik-hAP ac3', minQuantity: 3 },
    { modelKey: 'Cisco-Catalyst 1000-24T', minQuantity: 1 },
    { modelKey: 'Panduit-RJ45 Crimper Pro', minQuantity: 2 },
    { modelKey: 'Belden-Cat6 UTP 305m', minQuantity: 5 },
  ];

  for (const t of thresholdsData) {
    const model = modelMap[t.modelKey];
    if (!model) continue;

    const existing = await prisma.stockThreshold.findUnique({
      where: { modelId: model.id },
    });
    if (!existing) {
      await prisma.stockThreshold.create({
        data: {
          modelId: model.id,
          minQuantity: t.minQuantity,
          createdById: adminLogistik.id,
        },
      });
    }
  }
  console.log('✅ Stock thresholds seeded');

  // ============================================================
  // 7. CUSTOMERS (PRD 5.1 E — Code: TMI-YYYY-MMDD-XXXX)
  // ============================================================
  const customersData = [
    {
      code: 'TMI-2026-0301-0001',
      name: 'PT. Maju Bersama',
      address: 'Jl. Sudirman No. 123, Jakarta Selatan',
      phone: '02112345678',
      email: 'info@majubersama.co.id',
      picName: 'Budi Santoso',
      picPhone: '081234567890',
    },
    {
      code: 'TMI-2026-0301-0002',
      name: 'CV. Teknologi Nusantara',
      address: 'Jl. Gatot Subroto No. 45, Bandung',
      phone: '02287654321',
      email: 'admin@teknusa.co.id',
      picName: 'Siti Rahayu',
      picPhone: '081298765432',
    },
    {
      code: 'TMI-2026-0301-0003',
      name: 'PT. Digital Pratama',
      address: 'Jl. Diponegoro No. 78, Surabaya',
      phone: '03145678901',
      email: 'cs@digitalpratama.co.id',
      picName: 'Ahmad Hidayat',
      picPhone: '081356789012',
    },
  ];

  const customerMap: Record<string, number> = {};
  for (const c of customersData) {
    const customer = await prisma.customer.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
    customerMap[c.code] = customer.id;
  }
  console.log('✅ Customers seeded');

  // ============================================================
  // 8. REQUEST — Permintaan Baru (F-04a, Workflow 1)
  //    Code: RQ-YYYY-MMDD-XXXX
  // ============================================================
  const requestsData = [
    {
      code: 'RQ-2026-0410-0001',
      title: 'Permintaan Laptop Baru untuk Divisi Teknisi',
      description: 'Membutuhkan 2 unit laptop untuk teknisi lapangan baru',
      status: TransactionStatus.PENDING,
      priority: 'NORMAL',
      createdById: staff.id,
      approvalChain: [
        { role: 'LEADER', userId: leader.id, status: 'PENDING' },
        { role: 'ADMIN_LOGISTIK', userId: adminLogistik.id, status: 'PENDING' },
        { role: 'ADMIN_PURCHASE', userId: adminPurchase.id, status: 'PENDING' },
        { role: 'SUPERADMIN', userId: superadmin.id, status: 'PENDING' },
      ],
      items: [
        {
          description: 'Laptop ThinkPad X1 Carbon Gen 11',
          quantity: 2,
          modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
        },
      ],
    },
    {
      code: 'RQ-2026-0410-0002',
      title: 'Permintaan Router untuk Proyek Instalasi',
      description:
        'Membutuhkan 3 unit router MikroTik untuk proyek instalasi pelanggan baru',
      status: TransactionStatus.APPROVED,
      priority: 'URGENT',
      createdById: leader.id,
      approvalChain: [
        {
          role: 'ADMIN_LOGISTIK',
          userId: adminLogistik.id,
          status: 'APPROVED',
        },
        {
          role: 'ADMIN_PURCHASE',
          userId: adminPurchase.id,
          status: 'APPROVED',
        },
        { role: 'SUPERADMIN', userId: superadmin.id, status: 'APPROVED' },
      ],
      items: [
        {
          description: 'Router MikroTik hAP ac3',
          quantity: 3,
          modelKey: 'MikroTik-hAP ac3',
        },
      ],
    },
    {
      code: 'RQ-2026-0410-0003',
      title: 'Permintaan Material Kabel UTP',
      description: 'Stok kabel UTP menipis, perlu pengadaan 10 box',
      status: TransactionStatus.COMPLETED,
      priority: 'NORMAL',
      createdById: adminLogistik.id,
      approvalChain: [
        {
          role: 'ADMIN_PURCHASE',
          userId: adminPurchase.id,
          status: 'APPROVED',
        },
        { role: 'SUPERADMIN', userId: superadmin.id, status: 'APPROVED' },
      ],
      items: [
        {
          description: 'Kabel Belden Cat6 UTP 305m',
          quantity: 10,
          modelKey: 'Belden-Cat6 UTP 305m',
        },
      ],
    },
  ];

  for (const req of requestsData) {
    const existing = await prisma.request.findUnique({
      where: { code: req.code },
    });
    if (!existing) {
      await prisma.request.create({
        data: {
          code: req.code,
          title: req.title,
          description: req.description,
          status: req.status,
          priority: req.priority,
          createdById: req.createdById,
          approvalChain: req.approvalChain,
          items: {
            create: req.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              modelId: modelMap[item.modelKey]?.id ?? null,
            })),
          },
        },
      });
    }
  }
  console.log('✅ Requests (Permintaan Baru) seeded');

  // ============================================================
  // 9. LOAN REQUESTS — Peminjaman (F-04b, Workflow 2)
  //    Code: LN-YYYY-MMDD-XXXX
  // ============================================================
  const loansData = [
    {
      code: 'LN-2026-0410-0001',
      purpose: 'Peminjaman laptop untuk presentasi klien di luar kantor',
      status: TransactionStatus.APPROVED,
      expectedReturn: new Date('2026-04-20'),
      createdById: staff.id,
      approvalChain: [
        { role: 'LEADER', userId: leader.id, status: 'APPROVED' },
        {
          role: 'ADMIN_LOGISTIK',
          userId: adminLogistik.id,
          status: 'APPROVED',
        },
      ],
      items: [
        {
          description: 'Laptop ThinkPad X1 Carbon',
          quantity: 1,
          modelKey: 'Lenovo-ThinkPad X1 Carbon Gen 11',
        },
      ],
      assetAssignments: ['AS-2026-0115-0005'],
    },
    {
      code: 'LN-2026-0410-0002',
      purpose:
        'Peminjaman fusion splicer untuk pekerjaan fiber optic di lapangan',
      status: TransactionStatus.PENDING,
      expectedReturn: new Date('2026-04-25'),
      createdById: leader.id,
      approvalChain: [
        { role: 'ADMIN_LOGISTIK', userId: adminLogistik.id, status: 'PENDING' },
      ],
      items: [
        {
          description: 'Fujikura 90S Fusion Splicer',
          quantity: 1,
          modelKey: 'Fujikura-90S Fusion Splicer',
        },
      ],
      assetAssignments: [],
    },
  ];

  const loanMap: Record<string, string> = {};

  for (const loan of loansData) {
    const existing = await prisma.loanRequest.findUnique({
      where: { code: loan.code },
    });
    if (existing) {
      loanMap[loan.code] = existing.id;
      continue;
    }

    const created = await prisma.loanRequest.create({
      data: {
        code: loan.code,
        purpose: loan.purpose,
        status: loan.status,
        expectedReturn: loan.expectedReturn,
        createdById: loan.createdById,
        approvalChain: loan.approvalChain,
        items: {
          create: loan.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            modelId: modelMap[item.modelKey]?.id ?? null,
          })),
        },
      },
    });
    loanMap[loan.code] = created.id;

    for (const assetCode of loan.assetAssignments) {
      const assetId = assetMap[assetCode];
      if (assetId) {
        await prisma.loanAssetAssignment.create({
          data: { loanRequestId: created.id, assetId },
        });
      }
    }
  }
  console.log('✅ Loan requests (Peminjaman) seeded');

  // ============================================================
  // 10. ASSET RETURNS — Pengembalian (F-04c, Workflow 2)
  //     Code: RT-YYYY-MMDD-XXXX
  // ============================================================
  const returnLoanId = loanMap['LN-2026-0410-0001'];
  if (returnLoanId) {
    const existingReturn = await prisma.assetReturn.findUnique({
      where: { code: 'RT-2026-0410-0001' },
    });
    if (!existingReturn) {
      const assetId = assetMap['AS-2026-0115-0005'];
      if (assetId) {
        await prisma.assetReturn.create({
          data: {
            code: 'RT-2026-0410-0001',
            loanRequestId: returnLoanId,
            status: TransactionStatus.PENDING,
            note: 'Pengembalian laptop setelah presentasi selesai',
            createdById: staff.id,
            items: {
              create: [
                {
                  assetId,
                  conditionBefore: AssetCondition.GOOD,
                  conditionAfter: AssetCondition.GOOD,
                  note: 'Kondisi baik, tidak ada kerusakan',
                },
              ],
            },
          },
        });
      }
    }
  }
  console.log('✅ Asset returns (Pengembalian) seeded');

  // ============================================================
  // 11. HANDOVERS — Serah Terima (F-04d, Workflow 2)
  //     Code: HD-YYYY-MMDD-XXXX
  // ============================================================
  const handoversData = [
    {
      code: 'HD-2026-0410-0001',
      status: TransactionStatus.COMPLETED,
      fromUserId: adminLogistik.id,
      toUserId: leader.id,
      witnessUserId: superadmin.id,
      note: 'Serah terima laptop dan router untuk divisi teknisi',
      approvalChain: [
        {
          role: 'ADMIN_LOGISTIK',
          userId: adminLogistik.id,
          status: 'APPROVED',
        },
      ],
      assetCodes: ['AS-2026-0115-0001', 'AS-2026-0120-0002'],
    },
    {
      code: 'HD-2026-0410-0002',
      status: TransactionStatus.PENDING,
      fromUserId: leader.id,
      toUserId: staff.id,
      witnessUserId: adminLogistik.id,
      note: 'Serah terima crimper dan power meter ke teknisi lapangan',
      approvalChain: [
        { role: 'ADMIN_LOGISTIK', userId: adminLogistik.id, status: 'PENDING' },
      ],
      assetCodes: ['AS-2026-0110-0002', 'AS-2026-0125-0001'],
    },
  ];

  for (const hd of handoversData) {
    const existing = await prisma.handover.findUnique({
      where: { code: hd.code },
    });
    if (!existing) {
      await prisma.handover.create({
        data: {
          code: hd.code,
          status: hd.status,
          fromUserId: hd.fromUserId,
          toUserId: hd.toUserId,
          witnessUserId: hd.witnessUserId,
          note: hd.note,
          approvalChain: hd.approvalChain,
          items: {
            create: hd.assetCodes
              .filter((code) => assetMap[code])
              .map((code) => ({ assetId: assetMap[code] })),
          },
        },
      });
    }
  }
  console.log('✅ Handovers (Serah Terima) seeded');

  // ============================================================
  // 12. REPAIRS — Aset Rusak (F-04e, Workflow 2)
  //     Code: RP-YYYY-MMDD-XXXX
  // ============================================================
  const repairsData = [
    {
      code: 'RP-2026-0410-0001',
      assetCode: 'AS-2026-0201-0003',
      issueDescription:
        'Layar laptop menampilkan garis vertikal dan kadang berkedip',
      condition: AssetCondition.POOR,
      status: TransactionStatus.IN_PROGRESS,
      repairAction: 'Penggantian panel LCD',
      repairVendor: 'Apple Authorized Service Provider',
      repairCost: 5_500_000,
      startedAt: new Date('2026-04-08'),
      note: 'Estimasi selesai 2 minggu',
      createdById: staff.id,
      approvalChain: [
        { role: 'LEADER', userId: leader.id, status: 'APPROVED' },
        {
          role: 'ADMIN_LOGISTIK',
          userId: adminLogistik.id,
          status: 'APPROVED',
        },
      ],
    },
    {
      code: 'RP-2026-0410-0002',
      assetCode: 'AS-2026-0110-0001',
      issueDescription:
        'Crimper tidak bisa mengunci konektor RJ45 dengan sempurna',
      condition: AssetCondition.FAIR,
      status: TransactionStatus.PENDING,
      repairAction: null,
      repairVendor: null,
      repairCost: null,
      startedAt: null,
      note: null,
      createdById: leader.id,
      approvalChain: [
        { role: 'ADMIN_LOGISTIK', userId: adminLogistik.id, status: 'PENDING' },
      ],
    },
  ];

  for (const rep of repairsData) {
    const existing = await prisma.repair.findUnique({
      where: { code: rep.code },
    });
    if (!existing) {
      const assetId = assetMap[rep.assetCode];
      if (assetId) {
        await prisma.repair.create({
          data: {
            code: rep.code,
            assetId,
            issueDescription: rep.issueDescription,
            condition: rep.condition,
            status: rep.status,
            repairAction: rep.repairAction,
            repairVendor: rep.repairVendor,
            repairCost: rep.repairCost,
            startedAt: rep.startedAt,
            note: rep.note,
            createdById: rep.createdById,
            approvalChain: rep.approvalChain,
          },
        });
      }
    }
  }
  console.log('✅ Repairs (Aset Rusak) seeded');

  // ============================================================
  // 13. INFRA PROJECTS (F-04f, Workflow 3)
  //     Code: PRJ-YYYY-MMDD-XXXX
  // ============================================================
  const projectsData = [
    {
      code: 'PRJ-2026-0410-0001',
      name: 'Instalasi Jaringan PT. Maju Bersama',
      description:
        'Proyek pemasangan jaringan fiber optic dan konfigurasi router untuk kantor baru pelanggan',
      status: TransactionStatus.IN_PROGRESS,
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-05-15'),
      location: 'Jl. Sudirman No. 123, Jakarta Selatan',
      customerCode: 'TMI-2026-0301-0001',
      createdById: leader.id,
      tasks: [
        {
          title: 'Survey lokasi',
          description: 'Survey kebutuhan jaringan dan layout kabel',
          status: 'DONE',
          assigneeId: staff.id,
          dueDate: new Date('2026-04-16'),
        },
        {
          title: 'Penarikan kabel fiber',
          description: 'Penarikan kabel fiber optic dari POP ke lokasi',
          status: 'IN_PROGRESS',
          assigneeId: staff.id,
          dueDate: new Date('2026-04-25'),
        },
        {
          title: 'Konfigurasi router',
          description: 'Setup dan konfigurasi MikroTik router',
          status: 'TODO',
          assigneeId: leader.id,
          dueDate: new Date('2026-05-01'),
        },
        {
          title: 'Testing & commissioning',
          description: 'Pengujian konektivitas dan handover ke pelanggan',
          status: 'TODO',
          assigneeId: leader.id,
          dueDate: new Date('2026-05-10'),
        },
      ],
      materials: [
        {
          description: 'Kabel Fiber Optic SC-SC 100m',
          quantity: 2,
          modelKey: 'Commscope-SC-SC Singlemode 100m',
        },
        {
          description: 'Router MikroTik hAP ac3',
          quantity: 1,
          modelKey: 'MikroTik-hAP ac3',
        },
        {
          description: 'Konektor RJ45 Cat6',
          quantity: 50,
          modelKey: 'AMP-RJ45 Cat6 (100pcs)',
        },
      ],
      team: [
        { userId: leader.id, role: 'Project Manager' },
        { userId: staff.id, role: 'Teknisi' },
        { userId: adminLogistik.id, role: 'Koordinator Logistik' },
      ],
    },
    {
      code: 'PRJ-2026-0410-0002',
      name: 'Maintenance Jaringan CV. Teknologi Nusantara',
      description: 'Perawatan rutin dan upgrade jaringan pelanggan',
      status: TransactionStatus.PENDING,
      startDate: new Date('2026-04-20'),
      endDate: new Date('2026-04-30'),
      location: 'Jl. Gatot Subroto No. 45, Bandung',
      customerCode: 'TMI-2026-0301-0002',
      createdById: leader.id,
      tasks: [
        {
          title: 'Audit jaringan existing',
          description: 'Pengecekan kondisi jaringan saat ini',
          status: 'TODO',
          assigneeId: staff.id,
          dueDate: new Date('2026-04-21'),
        },
        {
          title: 'Penggantian kabel rusak',
          description: 'Ganti segment kabel yang sudah degradasi',
          status: 'TODO',
          assigneeId: staff.id,
          dueDate: new Date('2026-04-25'),
        },
      ],
      materials: [
        {
          description: 'Kabel Belden Cat6 UTP 305m',
          quantity: 3,
          modelKey: 'Belden-Cat6 UTP 305m',
        },
      ],
      team: [
        { userId: leader.id, role: 'Project Manager' },
        { userId: staff.id, role: 'Teknisi' },
      ],
    },
  ];

  for (const proj of projectsData) {
    const existing = await prisma.infraProject.findUnique({
      where: { code: proj.code },
    });
    if (!existing) {
      await prisma.infraProject.create({
        data: {
          code: proj.code,
          name: proj.name,
          description: proj.description,
          status: proj.status,
          startDate: proj.startDate,
          endDate: proj.endDate,
          location: proj.location,
          customerId: customerMap[proj.customerCode],
          createdById: proj.createdById,
          tasks: {
            create: proj.tasks.map((t) => ({
              title: t.title,
              description: t.description,
              status: t.status,
              assigneeId: t.assigneeId,
              dueDate: t.dueDate,
            })),
          },
          materials: {
            create: proj.materials.map((m) => ({
              description: m.description,
              quantity: m.quantity,
              modelId: modelMap[m.modelKey]?.id ?? null,
            })),
          },
          team: {
            create: proj.team.map((t) => ({
              userId: t.userId,
              role: t.role,
            })),
          },
        },
      });
    }
  }
  console.log('✅ Infra projects seeded');

  // ============================================================
  // 14. CUSTOMER OPERATIONS (F-05)
  //     Installation: INT-, Maintenance: MT-, Dismantle: DSM-
  // ============================================================

  // --- Installation ---
  const installationsData = [
    {
      code: 'INT-2026-0410-0001',
      customerCode: 'TMI-2026-0301-0001',
      status: TransactionStatus.IN_PROGRESS,
      scheduledAt: new Date('2026-04-18'),
      location: 'Jl. Sudirman No. 123, Jakarta Selatan - Lantai 3',
      note: 'Instalasi jaringan LAN 24 port untuk lantai 3',
      createdById: adminLogistik.id,
      materials: [
        { description: 'Kabel Cat6 UTP 305m', quantity: 5 },
        { description: 'Switch Cisco Catalyst 1000', quantity: 1 },
        { description: 'Konektor RJ45 Cat6', quantity: 100 },
      ],
    },
  ];

  for (const inst of installationsData) {
    const existing = await prisma.installation.findUnique({
      where: { code: inst.code },
    });
    if (!existing) {
      await prisma.installation.create({
        data: {
          code: inst.code,
          customerId: customerMap[inst.customerCode],
          status: inst.status,
          scheduledAt: inst.scheduledAt,
          location: inst.location,
          note: inst.note,
          createdById: inst.createdById,
          materials: {
            create: inst.materials.map((m) => ({
              description: m.description,
              quantity: m.quantity,
            })),
          },
        },
      });
    }
  }
  console.log('✅ Installations seeded');

  // --- Maintenance ---
  const maintenancesData = [
    {
      code: 'MT-2026-0410-0001',
      customerCode: 'TMI-2026-0301-0002',
      status: TransactionStatus.PENDING,
      scheduledAt: new Date('2026-04-22'),
      issueReport:
        'Pelanggan melaporkan koneksi internet intermittent sejak 3 hari lalu',
      createdById: adminLogistik.id,
      materials: [{ description: 'Kabel Fiber Patchcord SC-SC', quantity: 2 }],
    },
  ];

  for (const maint of maintenancesData) {
    const existing = await prisma.maintenance.findUnique({
      where: { code: maint.code },
    });
    if (!existing) {
      await prisma.maintenance.create({
        data: {
          code: maint.code,
          customerId: customerMap[maint.customerCode],
          status: maint.status,
          scheduledAt: maint.scheduledAt,
          issueReport: maint.issueReport,
          createdById: maint.createdById,
          materials: {
            create: maint.materials.map((m) => ({
              description: m.description,
              quantity: m.quantity,
            })),
          },
        },
      });
    }
  }
  console.log('✅ Maintenances seeded');

  // --- Dismantle ---
  const dismantlesData = [
    {
      code: 'DSM-2026-0410-0001',
      customerCode: 'TMI-2026-0301-0003',
      status: TransactionStatus.PENDING,
      scheduledAt: new Date('2026-04-28'),
      reason:
        'Pelanggan pindah lokasi kantor, perlu pencabutan seluruh perangkat jaringan',
      note: 'Koordinasi dengan pelanggan untuk jadwal dismantle di luar jam kerja',
      createdById: adminLogistik.id,
    },
  ];

  for (const dsm of dismantlesData) {
    const existing = await prisma.dismantle.findUnique({
      where: { code: dsm.code },
    });
    if (!existing) {
      await prisma.dismantle.create({
        data: {
          code: dsm.code,
          customerId: customerMap[dsm.customerCode],
          status: dsm.status,
          scheduledAt: dsm.scheduledAt,
          reason: dsm.reason,
          note: dsm.note,
          createdById: dsm.createdById,
        },
      });
    }
  }
  console.log('✅ Dismantles seeded');

  // ============================================================
  // 15. NOTIFICATIONS (Cross-cutting samples)
  // ============================================================
  const notificationsData = [
    {
      userId: leader.id,
      type: NotificationType.APPROVAL_REQUIRED,
      title: 'Permintaan Baru Menunggu Persetujuan',
      message:
        'Staff Teknisi mengajukan permintaan 2 unit laptop. Kode: RQ-2026-0410-0001',
      link: '/requests/RQ-2026-0410-0001',
    },
    {
      userId: adminLogistik.id,
      type: NotificationType.APPROVAL_REQUIRED,
      title: 'Peminjaman Menunggu Persetujuan',
      message:
        'Leader Teknisi mengajukan peminjaman fusion splicer. Kode: LN-2026-0410-0002',
      link: '/loans/LN-2026-0410-0002',
    },
    {
      userId: superadmin.id,
      type: NotificationType.INFO,
      title: 'Proyek Dimulai',
      message:
        'Proyek Instalasi Jaringan PT. Maju Bersama (PRJ-2026-0410-0001) telah dimulai',
      link: '/projects/PRJ-2026-0410-0001',
    },
    {
      userId: staff.id,
      type: NotificationType.STATUS_CHANGE,
      title: 'Pinjaman Disetujui',
      message:
        'Peminjaman laptop Anda (LN-2026-0410-0001) telah disetujui. Silakan ambil di gudang',
      link: '/loans/LN-2026-0410-0001',
    },
    {
      userId: adminLogistik.id,
      type: NotificationType.WARNING,
      title: 'Stok Router Rendah',
      message:
        'Stok Router MikroTik hAP ac3 di bawah batas minimum (sisa: 1, minimum: 3)',
      link: '/assets/stock?view=main',
    },
  ];

  for (const notif of notificationsData) {
    const count = await prisma.notification.count({
      where: { userId: notif.userId, title: notif.title },
    });
    if (count === 0) {
      await prisma.notification.create({ data: notif });
    }
  }
  console.log('✅ Notifications seeded');

  console.log('\n🎉 Seed completed!');
  console.log('   📊 Summary:');
  console.log('   - 4 Divisions');
  console.log('   - 5 Users (1 per role)');
  console.log('   - 3 Asset Categories → 9 Types → 11 Models');
  console.log('   - 11 Purchase records + 8 Depreciation records');
  console.log('   - 20 Assets + Stock movements');
  console.log('   - 6 Stock thresholds');
  console.log('   - 3 Customers');
  console.log('   - 3 Requests (Permintaan Baru)');
  console.log('   - 2 Loan Requests (Peminjaman)');
  console.log('   - 1 Asset Return (Pengembalian)');
  console.log('   - 2 Handovers (Serah Terima)');
  console.log('   - 2 Repairs (Aset Rusak)');
  console.log('   - 2 Infra Projects');
  console.log('   - 1 Installation, 1 Maintenance, 1 Dismantle');
  console.log('   - 5 Notifications');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
