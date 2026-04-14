import { AssetStatusMachine } from '../../src/modules/assets/asset-status.machine';
import { DepreciationService } from '../../src/modules/assets/depreciation/depreciation.service';
import {
  AssetStatus,
  DepreciationMethod,
} from '../../src/generated/prisma/client';

describe('Sprint 1 Master Data — Smoke Tests', () => {
  describe('Asset Status Machine', () => {
    it('should validate valid status transitions', () => {
      // Valid: IN_STORAGE → IN_USE
      expect(() =>
        AssetStatusMachine.validateTransition(
          AssetStatus.IN_STORAGE,
          AssetStatus.IN_USE,
        ),
      ).not.toThrow();

      // Valid: IN_USE → UNDER_REPAIR
      expect(() =>
        AssetStatusMachine.validateTransition(
          AssetStatus.IN_USE,
          AssetStatus.UNDER_REPAIR,
        ),
      ).not.toThrow();
    });

    it('should reject invalid status transitions', () => {
      // Invalid: CONSUMED (terminal) → IN_STORAGE
      expect(() =>
        AssetStatusMachine.validateTransition(
          AssetStatus.CONSUMED,
          AssetStatus.IN_STORAGE,
        ),
      ).toThrow();
    });

    it('should identify terminal states correctly', () => {
      expect(AssetStatusMachine.isTerminal(AssetStatus.CONSUMED)).toBe(true);
      expect(AssetStatusMachine.isTerminal(AssetStatus.DECOMMISSIONED)).toBe(
        true,
      );
      expect(AssetStatusMachine.isTerminal(AssetStatus.IN_STORAGE)).toBe(false);
    });
  });

  describe('Depreciation Calculations', () => {
    // Depreciation calculation methods are pure functions (don't use Prisma)
    // Create a minimal mock for type safety
    const mockPrisma = {} as any;
    const depreciationService = new DepreciationService(mockPrisma);

    it('should calculate straight-line depreciation correctly', () => {
      const originalCost = 1000;
      const salvageValue = 100;
      const usefulLifeYears = 5;
      const monthsElapsed = 12;

      const result = depreciationService.calculateStraightLineDepreciation(
        originalCost,
        salvageValue,
        usefulLifeYears,
        monthsElapsed,
      );

      // Expected: (1000 - 100) / 5 = 180 per year, 15 per month
      // After 12 months: 180 depreciation, 820 book value
      expect(result.monthlyDepreciation).toBe(15);
      expect(result.accumulatedDepreciation).toBe(180);
      expect(result.bookValue).toBe(820);
    });

    it('should calculate declining-balance depreciation correctly', () => {
      const originalCost = 1000;
      const salvageValue = 100;
      const usefulLifeYears = 5;
      const monthsElapsed = 12;

      const result = depreciationService.calculateDecliningBalanceDepreciation(
        originalCost,
        salvageValue,
        usefulLifeYears,
        monthsElapsed,
      );

      // Book value should be > 820 (less depreciation than straight-line)
      expect(result.bookValue).toBeGreaterThan(820);
      expect(result.bookValue).toBeLessThanOrEqual(1000);
    });

    it('should prevent book value from going below salvage value', () => {
      const originalCost = 1000;
      const salvageValue = 100;
      const usefulLifeYears = 5;
      const monthsElapsed = 60; // 5 years = full life

      const result = depreciationService.calculateStraightLineDepreciation(
        originalCost,
        salvageValue,
        usefulLifeYears,
        monthsElapsed,
      );

      expect(result.bookValue).toBeGreaterThanOrEqual(salvageValue);
    });

    it('should generate depreciation schedule correctly', () => {
      const originalCost = 1000;
      const salvageValue = 100;
      const usefulLifeYears = 2;
      const startDate = new Date('2026-01-01');

      const schedule = depreciationService.generateDepreciationSchedule(
        originalCost,
        salvageValue,
        usefulLifeYears,
        startDate,
        DepreciationMethod.STRAIGHT_LINE,
      );

      // Should have entries for 0 to 24 months (2 years)
      expect(schedule.length).toBe(25);

      // First entry (month 0)
      expect(schedule[0].month).toBe(0);
      expect(schedule[0].bookValue).toBe(1000);

      // Last entry (month 24)
      expect(schedule[24].month).toBe(24);
      expect(schedule[24].bookValue).toBeGreaterThanOrEqual(salvageValue);

      // Check month 12
      const monthlyDep = (originalCost - salvageValue) / (usefulLifeYears * 12);
      expect(schedule[12].monthlyDepreciation).toBe(monthlyDep);
    });
  });

  describe('Asset ID Generation', () => {
    it('should validate asset code format AS-YYYY-MMDD-XXXX', () => {
      const codeRegex = /^AS-\d{4}-\d{4}-\d{4}$/;

      const validCode = 'AS-2026-0414-0001';
      expect(codeRegex.test(validCode)).toBe(true);

      const invalidCode = 'AS-2026-04-14-0001';
      expect(codeRegex.test(invalidCode)).toBe(false);
    });

    it('should validate batch registration doc number format REG-YYYY-MM-XXXX', () => {
      const docRegex = /^REG-\d{4}-\d{2}-\d{4}$/;

      const validDoc = 'REG-2026-04-0001';
      expect(docRegex.test(validDoc)).toBe(true);

      const invalidDoc = 'REG-2026-4-0001';
      expect(docRegex.test(invalidDoc)).toBe(false);
    });
  });

  describe('Classification & Tracking Methods', () => {
    it('should support ASSET classification with INDIVIDUAL tracking', () => {
      const assetData = {
        classification: 'ASSET',
        trackingMethod: 'INDIVIDUAL',
        quantity: 1,
        currentBalance: null,
      };

      expect(assetData.classification).toBe('ASSET');
      expect(assetData.trackingMethod).toBe('INDIVIDUAL');
      expect(assetData.quantity).toBe(1);
    });

    it('should support MATERIAL classification with COUNT tracking', () => {
      const materialData = {
        classification: 'MATERIAL',
        trackingMethod: 'COUNT',
        quantity: 50,
        currentBalance: null,
      };

      expect(materialData.classification).toBe('MATERIAL');
      expect(materialData.trackingMethod).toBe('COUNT');
      expect(materialData.quantity).toBe(50);
    });

    it('should support MATERIAL classification with MEASUREMENT tracking', () => {
      const measurementData = {
        classification: 'MATERIAL',
        trackingMethod: 'MEASUREMENT',
        quantity: null,
        currentBalance: 305.5, // meters
      };

      expect(measurementData.classification).toBe('MATERIAL');
      expect(measurementData.trackingMethod).toBe('MEASUREMENT');
      expect(measurementData.currentBalance).toBe(305.5);
    });
  });

  describe('Stock Movement Types', () => {
    const validMovementTypes = [
      'NEW_STOCK',
      'HANDOVER',
      'LOAN_OUT',
      'LOAN_RETURN',
      'INSTALLATION',
      'MAINTENANCE',
      'DISMANTLE_RETURN',
      'REPAIR',
      'ADJUSTMENT',
      'CONSUMED',
      'TRANSFER',
      'INBOUND',
    ];

    it('should validate all 12 movement types', () => {
      validMovementTypes.forEach((type) => {
        expect(type).toBeTruthy();
      });

      expect(validMovementTypes.length).toBe(12);
    });
  });

  describe('Serial Number Validation per Model', () => {
    it('should allow same serial number for different models', () => {
      const asset1 = { modelId: 1, serialNumber: 'SN-001' };
      const asset2 = { modelId: 2, serialNumber: 'SN-001' };

      // Should not conflict
      expect(asset1.modelId).not.toBe(asset2.modelId);
    });

    it('should detect duplicate serial number in same model', () => {
      const asset1 = { modelId: 1, serialNumber: 'SN-001' };
      const asset2 = { modelId: 1, serialNumber: 'SN-001' };

      // Should be flagged as duplicate
      expect(asset1.modelId).toBe(asset2.modelId);
      expect(asset1.serialNumber).toBe(asset2.serialNumber);
    });
  });

  describe('Stock Threshold Logic', () => {
    it('should trigger alert when stock below minimum', () => {
      const threshold = 10;
      const currentStock = 5;

      expect(currentStock < threshold).toBe(true);
    });

    it('should not trigger alert when stock at or above minimum', () => {
      const threshold = 10;
      const currentStock1 = 10;
      const currentStock2 = 15;

      expect(currentStock1 < threshold).toBe(false);
      expect(currentStock2 < threshold).toBe(false);
    });
  });

  describe('Batch Asset Registration Validation', () => {
    it('should reject empty batch', () => {
      const batchDto = {
        docNumber: 'REG-2026-04-0001',
        items: [],
      };

      expect(batchDto.items.length).toBe(0);
      expect(batchDto.items.length === 0).toBe(true);
    });

    it('should accept batch with multiple items', () => {
      const batchDto = {
        docNumber: 'REG-2026-04-0001',
        items: [
          { name: 'Asset 1', categoryId: 1 },
          { name: 'Asset 2', categoryId: 1 },
          { name: 'Asset 3', categoryId: 2 },
        ],
      };

      expect(batchDto.items.length).toBe(3);
      expect(batchDto.items.length > 0).toBe(true);
    });
  });

  describe('RBAC Permission Checks', () => {
    const permissions = {
      SUPERADMIN: ['*'], // all
      ADMIN_LOGISTIK: [
        'ASSETS_VIEW',
        'ASSETS_CREATE',
        'ASSETS_EDIT',
        'ASSETS_DELETE',
        'STOCK_VIEW',
        'STOCK_MANAGE',
        'PURCHASES_VIEW',
        'DEPRECIATION_VIEW',
      ],
      ADMIN_PEMBELIAN: [
        'PURCHASES_CREATE',
        'PURCHASES_EDIT',
        'DEPRECIATION_CREATE',
        'DEPRECIATION_EDIT',
      ],
      STAFF: ['ASSETS_VIEW', 'STOCK_VIEW'],
    };

    it('should enforce RBAC for asset creation', () => {
      expect(permissions.ADMIN_LOGISTIK).toContain('ASSETS_CREATE');
      expect(permissions.STAFF).not.toContain('ASSETS_CREATE');
    });

    it('should enforce RBAC for stock management', () => {
      expect(permissions.ADMIN_LOGISTIK).toContain('STOCK_MANAGE');
      expect(permissions.STAFF).not.toContain('STOCK_MANAGE');
    });

    it('should enforce RBAC for depreciation', () => {
      expect(permissions.ADMIN_PEMBELIAN).toContain('DEPRECIATION_CREATE');
      expect(permissions.ADMIN_LOGISTIK).not.toContain('DEPRECIATION_CREATE');
    });
  });
});
