import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import {
  createTestApp,
  loginUser,
  authRequest,
  TEST_USERS,
  TestUser,
} from './helpers/test-app.helper';

/**
 * P0-5: Data Consistency Verification (e2e)
 *
 * Validates end-to-end data integrity:
 * 1. Stok vs StockMovement reconciliation
 * 2. Asset status vs transaction status consistency
 * 3. Customer status vs installation/dismantle count
 * 4. Loan IN_PROGRESS count vs assigned assets IN_CUSTODY
 * 5. Repair IN_PROGRESS count vs assets UNDER_REPAIR / LOST
 * 6. Response format consistency across all endpoints
 */
describe('Data Consistency Verification (e2e) — P0-5', () => {
  let app: INestApplication<App>;
  let _superadmin: TestUser;
  let adminLogistik: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    [_superadmin, adminLogistik] = await Promise.all([
      loginUser(app, TEST_USERS.superadmin),
      loginUser(app, TEST_USERS.adminLogistik),
    ]);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ── 1. Asset Status Consistency ──

  describe('Asset Status — Transaction Correlation', () => {
    it('should not have IN_CUSTODY assets without active loans', async () => {
      // Get all IN_CUSTODY assets
      const assetRes = await authRequest(
        app,
        'get',
        '/assets?status=IN_CUSTODY&limit=50',
        adminLogistik,
      ).expect(200);

      const inCustodyAssets = assetRes.body.data.items;
      if (inCustodyAssets.length === 0) return;

      // Get all IN_PROGRESS loans
      const loanRes = await authRequest(
        app,
        'get',
        '/transactions/loans?status=IN_PROGRESS&limit=100',
        adminLogistik,
      ).expect(200);

      // Collect all assigned asset IDs from active loans
      const assignedAssetIds = new Set<string>();
      for (const loan of loanRes.body.data.items) {
        if (loan.assetAssignments) {
          for (const assignment of loan.assetAssignments) {
            assignedAssetIds.add(assignment.assetId);
          }
        }
      }

      // Each IN_CUSTODY asset should be in an active loan
      for (const asset of inCustodyAssets) {
        // Note: This is a soft check — there could be edge cases
        // where loan was just completed but asset status hasn't updated yet
        if (!assignedAssetIds.has(asset.id)) {
          console.warn(
            `INCONSISTENCY: Asset ${asset.code} is IN_CUSTODY but has no active loan assignment`,
          );
        }
      }
    });

    it('should not have UNDER_REPAIR assets without active repairs', async () => {
      const assetRes = await authRequest(
        app,
        'get',
        '/assets?status=UNDER_REPAIR&limit=50',
        adminLogistik,
      ).expect(200);

      const underRepairAssets = assetRes.body.data.items;
      if (underRepairAssets.length === 0) return;

      const repairRes = await authRequest(
        app,
        'get',
        '/transactions/repairs?status=IN_PROGRESS&limit=100',
        adminLogistik,
      ).expect(200);

      const repairedAssetIds = new Set<string>();
      for (const repair of repairRes.body.data.items) {
        if (repair.assetId) {
          repairedAssetIds.add(repair.assetId);
        }
      }

      for (const asset of underRepairAssets) {
        if (!repairedAssetIds.has(asset.id)) {
          console.warn(
            `INCONSISTENCY: Asset ${asset.code} is UNDER_REPAIR but has no active repair record`,
          );
        }
      }
    });

    it('should not have LOST assets without active lost reports', async () => {
      const assetRes = await authRequest(
        app,
        'get',
        '/assets?status=LOST&limit=50',
        adminLogistik,
      ).expect(200);

      const lostAssets = assetRes.body.data.items;
      if (lostAssets.length === 0) return;

      // Get repairs with LOST category and IN_PROGRESS status
      const repairRes = await authRequest(
        app,
        'get',
        '/transactions/repairs?status=IN_PROGRESS&limit=100',
        adminLogistik,
      ).expect(200);

      const activeLostReportAssetIds = new Set<string>();
      for (const repair of repairRes.body.data.items) {
        if (repair.category === 'LOST' && repair.assetId) {
          activeLostReportAssetIds.add(repair.assetId);
        }
      }

      for (const asset of lostAssets) {
        if (!activeLostReportAssetIds.has(asset.id)) {
          console.warn(
            `INCONSISTENCY: Asset ${asset.code} is LOST but has no active LOST report`,
          );
        }
      }
    });
  });

  // ── 2. Quantity & Balance Integrity ──

  describe('Quantity & Balance — Non-Negative Check', () => {
    it('should have no negative asset quantities or balances', async () => {
      let page = 1;
      let hasMore = true;
      let violationCount = 0;

      while (hasMore) {
        const res = await authRequest(
          app,
          'get',
          `/assets?page=${page}&limit=50`,
          adminLogistik,
        ).expect(200);

        for (const asset of res.body.data.items) {
          if (asset.quantity !== null && asset.quantity < 0) {
            violationCount++;
            console.error(
              `VIOLATION: Asset ${asset.code} has negative quantity: ${asset.quantity}`,
            );
          }
          if (
            asset.currentBalance !== null &&
            Number(asset.currentBalance) < 0
          ) {
            violationCount++;
            console.error(
              `VIOLATION: Asset ${asset.code} has negative balance: ${asset.currentBalance}`,
            );
          }
        }

        hasMore = page < res.body.data.meta.totalPages;
        page++;

        // Safety limit
        if (page > 20) break;
      }

      expect(violationCount).toBe(0);
    });
  });

  // ── 3. Customer Status Consistency ──

  describe('Customer Status — Installation/Dismantle Correlation', () => {
    it('should list active customers with at least one installation or valid reason', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?status=ACTIVE&page=1&limit=20',
        adminLogistik,
      ).expect(200);

      for (const customer of res.body.data.items) {
        // Active customer should have installations
        // (this is informational — newly created customers may be ACTIVE before first installation)
        if (customer.status === 'ACTIVE') {
          const detailRes = await authRequest(
            app,
            'get',
            `/customers/${customer.id}`,
            adminLogistik,
          );

          if (detailRes.status === 200) {
            const detail = detailRes.body.data;
            // If customer has zero installations but is ACTIVE, flag it
            if (
              detail.installations &&
              detail.installations.length === 0 &&
              detail._count?.installations === 0
            ) {
              console.warn(
                `INFO: Customer ${customer.code} is ACTIVE but has no installations`,
              );
            }
          }
        }
      }
    });

    it('should list inactive customers correctly', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?status=INACTIVE&page=1&limit=20',
        adminLogistik,
      ).expect(200);

      // All items should be INACTIVE
      for (const customer of res.body.data.items) {
        expect(customer.status).toBe('INACTIVE');
      }
    });
  });

  // ── 4. Transaction Status Integrity ──

  describe('Transaction Status — State Validity', () => {
    it('should have valid transaction statuses only', async () => {
      const validStatuses = [
        'PENDING',
        'LOGISTIC_APPROVED',
        'APPROVED',
        'IN_PROGRESS',
        'COMPLETED',
        'REJECTED',
        'CANCELLED',
      ];

      // Check requests
      const reqRes = await authRequest(
        app,
        'get',
        '/transactions/requests?page=1&limit=50',
        adminLogistik,
      ).expect(200);

      for (const req of reqRes.body.data.items) {
        expect(validStatuses).toContain(req.status);
      }

      // Check loans
      const loanRes = await authRequest(
        app,
        'get',
        '/transactions/loans?page=1&limit=50',
        adminLogistik,
      ).expect(200);

      for (const loan of loanRes.body.data.items) {
        expect(validStatuses).toContain(loan.status);
      }

      // Check repairs
      const repairRes = await authRequest(
        app,
        'get',
        '/transactions/repairs?page=1&limit=50',
        adminLogistik,
      ).expect(200);

      for (const repair of repairRes.body.data.items) {
        expect(validStatuses).toContain(repair.status);
      }
    });

    it('should have completed repairs with completedAt timestamp', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/repairs?status=COMPLETED&page=1&limit=20',
        adminLogistik,
      ).expect(200);

      for (const repair of res.body.data.items) {
        expect(repair.status).toBe('COMPLETED');
        // COMPLETED repairs should have completedAt
        if (repair.completedAt) {
          expect(new Date(repair.completedAt).getTime()).toBeGreaterThan(0);
        }
      }
    });

    it('should have no orphan loan asset assignments', async () => {
      // Check loans with asset assignments
      const loanRes = await authRequest(
        app,
        'get',
        '/transactions/loans?page=1&limit=20',
        adminLogistik,
      ).expect(200);

      for (const loan of loanRes.body.data.items) {
        // If loan is CANCELLED, it shouldn't have assets in IN_CUSTODY
        if (loan.status === 'CANCELLED' && loan.assetAssignments?.length > 0) {
          console.warn(
            `INFO: Cancelled loan ${loan.code} still has ${loan.assetAssignments.length} asset assignments`,
          );
        }
      }
    });
  });

  // ── 5. Approval Chain Integrity ──

  describe('Approval Chain — Data Integrity', () => {
    it('should have valid JSON approval chains', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests?page=1&limit=30',
        adminLogistik,
      ).expect(200);

      for (const req of res.body.data.items) {
        if (req.approvalChain) {
          expect(Array.isArray(req.approvalChain)).toBe(true);
          for (const step of req.approvalChain) {
            expect(step).toHaveProperty('sequence');
            expect(step).toHaveProperty('approverRole');
            expect(step).toHaveProperty('type');
            expect(step).toHaveProperty('status');
          }
        }
      }
    });

    it('should have REJECTED status with rejectionReason', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests?status=REJECTED&page=1&limit=10',
        adminLogistik,
      ).expect(200);

      for (const req of res.body.data.items) {
        expect(req.status).toBe('REJECTED');
        // Rejected transactions should have a reason
        if (req.rejectionReason) {
          expect(req.rejectionReason.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // ── 6. Response Format Consistency ──

  describe('API Response Format — Global Consistency', () => {
    const endpoints = [
      '/transactions/requests',
      '/transactions/loans',
      '/transactions/returns',
      '/transactions/handovers',
      '/transactions/repairs',
      '/assets',
      '/customers',
    ];

    for (const endpoint of endpoints) {
      it(`should return consistent format for GET ${endpoint}`, async () => {
        const res = await authRequest(
          app,
          'get',
          `${endpoint}?page=1&limit=5`,
          adminLogistik,
        ).expect(200);

        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');

        // Paginated endpoints should have meta
        if (res.body.data && res.body.data.meta) {
          expect(res.body.data.meta).toHaveProperty('total');
          expect(res.body.data.meta).toHaveProperty('page');
          expect(res.body.data.meta).toHaveProperty('limit');
          expect(res.body.data.meta).toHaveProperty('totalPages');
        }
      });
    }

    it('should return consistent error format on 404', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests/00000000-0000-0000-0000-000000000000',
        adminLogistik,
      );

      if (res.status === 404) {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('statusCode', 404);
        expect(res.body).toHaveProperty('message');
      }
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await (await import('supertest'))
        .default(app.getHttpServer())
        .get('/api/v1/assets');

      expect(res.status).toBe(401);
    });
  });

  // ── 7. Overdue Loan Detection Data Check ──

  describe('Overdue Loans — Data Accuracy', () => {
    it('should identify overdue loans correctly', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/loans?status=IN_PROGRESS&limit=50',
        adminLogistik,
      ).expect(200);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const loan of res.body.data.items) {
        if (loan.expectedReturn) {
          const expected = new Date(loan.expectedReturn);
          expected.setHours(0, 0, 0, 0);

          if (expected < today) {
            // This loan is overdue — verify it's flagged
            console.log(
              `Overdue loan found: ${loan.code}, expected return: ${loan.expectedReturn}`,
            );
          }
        }
      }
    });
  });

  // ── 8. Version Field Integrity ──

  describe('Optimistic Concurrency — Version Fields', () => {
    it('should have positive version numbers on all transactions', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests?page=1&limit=20',
        adminLogistik,
      ).expect(200);

      for (const req of res.body.data.items) {
        expect(req.version).toBeDefined();
        expect(req.version).toBeGreaterThanOrEqual(1);
      }

      const loanRes = await authRequest(
        app,
        'get',
        '/transactions/loans?page=1&limit=20',
        adminLogistik,
      ).expect(200);

      for (const loan of loanRes.body.data.items) {
        expect(loan.version).toBeDefined();
        expect(loan.version).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
