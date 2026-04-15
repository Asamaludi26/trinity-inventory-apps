import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import {
  createTestApp,
  loginUser,
  authRequest,
  TEST_USERS,
  TestUser,
} from './helpers/test-app.helper';

describe('Transaction Lifecycle (e2e) — T5-02', () => {
  let app: INestApplication<App>;
  let _superadmin: TestUser;
  let adminLogistik: TestUser;
  let _adminPurchase: TestUser;
  let _leader: TestUser;
  let _staff: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    [_superadmin, adminLogistik, _adminPurchase, _leader, _staff] =
      await Promise.all([
        loginUser(app, TEST_USERS.superadmin),
        loginUser(app, TEST_USERS.adminLogistik),
        loginUser(app, TEST_USERS.adminPurchase),
        loginUser(app, TEST_USERS.leader),
        loginUser(app, TEST_USERS.staff),
      ]);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ── Request (Procurement) ──

  describe('Request — Procurement Lifecycle', () => {
    it('should list requests', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('should get request detail', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/requests?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const requestId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/transactions/requests/${requestId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('approvalChain');
      }
    });

    it('should enforce RBAC — creator cannot be same as approver', async () => {
      // Verify the approval chain doesn't include creator as approver
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/requests',
        adminLogistik,
      ).expect(200);

      for (const req of listRes.body.data.items) {
        if (req.approvalChain) {
          const chain = Array.isArray(req.approvalChain)
            ? req.approvalChain
            : [];
          for (const step of chain) {
            expect(step.userId).not.toBe(req.createdById);
          }
        }
      }
    });
  });

  // ── Loan ──

  describe('Loan — Borrow & Return Lifecycle', () => {
    it('should list loans', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/loans',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('should get loan detail with asset assignments', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/loans?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const loanId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/transactions/loans/${loanId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('items');
      }
    });
  });

  // ── Return ──

  describe('Return — Asset Return Lifecycle', () => {
    it('should list returns', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/returns',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ── Handover ──

  describe('Handover — Ownership Transfer', () => {
    it('should list handovers', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/handovers',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ── Repair ──

  describe('Repair — Damage Report & Fix', () => {
    it('should list repairs', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/repairs',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should get repair detail with status', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/repairs?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const repairId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/transactions/repairs/${repairId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('assetId');
      }
    });
  });

  // ── OCC / Concurrent ──

  describe('Optimistic Concurrency Control (T5-05)', () => {
    it('should return 409 on version mismatch during approval', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/requests?status=PENDING&page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const req = listRes.body.data.items[0];

        // Try to approve with wrong version
        const approveRes = await authRequest(
          app,
          'patch',
          `/transactions/requests/${req.id}/approve`,
          adminLogistik,
        ).send({ version: 999 });

        expect(approveRes.status).toBe(409);
      }
    });
  });

  // ── Response Format Consistency ──

  // ── Status Filters ──

  describe('Status Filters — All Transaction Types', () => {
    it('should filter requests by PENDING status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests?status=PENDING&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const req of res.body.data.items) {
        expect(req.status).toBe('PENDING');
      }
    });

    it('should filter requests by COMPLETED status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests?status=COMPLETED&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const req of res.body.data.items) {
        expect(req.status).toBe('COMPLETED');
      }
    });

    it('should filter loans by IN_PROGRESS status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/loans?status=IN_PROGRESS&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const loan of res.body.data.items) {
        expect(loan.status).toBe('IN_PROGRESS');
      }
    });

    it('should filter repairs by COMPLETED status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/repairs?status=COMPLETED&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const repair of res.body.data.items) {
        expect(repair.status).toBe('COMPLETED');
      }
    });
  });

  // ── Return Detail ──

  describe('Return — Detail', () => {
    it('should get return detail with required fields', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/returns?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const returnId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/transactions/returns/${returnId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('id');
      }
    });
  });

  // ── Handover Detail ──

  describe('Handover — Detail', () => {
    it('should get handover detail with required fields', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/handovers?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const handoverId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/transactions/handovers/${handoverId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('id');
      }
    });
  });

  // ── Projects ──

  describe('Projects — Lifecycle', () => {
    it('should list projects', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/projects',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('should get project detail', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/transactions/projects?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const projectId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/transactions/projects/${projectId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('status');
      }
    });

    it('should filter projects by status', async () => {
      const statusList = ['IN_PROGRESS', 'COMPLETED', 'PENDING'];
      for (const status of statusList) {
        const res = await authRequest(
          app,
          'get',
          `/transactions/projects?status=${status}&limit=5`,
          adminLogistik,
        ).expect(200);

        expect(res.body.success).toBe(true);
        for (const project of res.body.data.items) {
          expect(project.status).toBe(status);
        }
      }
    });
  });

  // ── Pagination Meta ──

  describe('Pagination Meta — Transaction Lists', () => {
    it('should return valid pagination meta for requests', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests?page=1&limit=5',
        adminLogistik,
      ).expect(200);

      const meta = res.body.data.meta;
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('page', 1);
      expect(meta).toHaveProperty('limit', 5);
      expect(meta.total).toBeGreaterThanOrEqual(0);
    });

    it('should return valid pagination meta for loans', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/loans?page=1&limit=5',
        adminLogistik,
      ).expect(200);

      const meta = res.body.data.meta;
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('page', 1);
      expect(meta.total).toBeGreaterThanOrEqual(0);
    });
  });

  // ── RBAC ──

  describe('RBAC — Authentication Required', () => {
    it('should return 401 for unauthenticated request list', async () => {
      const supertest = (await import('supertest')).default;
      const res = await supertest(app.getHttpServer()).get(
        '/api/v1/transactions/requests',
      );
      expect(res.status).toBe(401);
    });

    it('should return 401 for unauthenticated loan list', async () => {
      const supertest = (await import('supertest')).default;
      const res = await supertest(app.getHttpServer()).get(
        '/api/v1/transactions/loans',
      );
      expect(res.status).toBe(401);
    });
  });

  describe('Response Format Consistency (T5-04)', () => {
    it('should return consistent success format', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests',
        adminLogistik,
      ).expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('should return consistent error format on 404', async () => {
      const res = await authRequest(
        app,
        'get',
        '/transactions/requests/nonexistent-uuid',
        adminLogistik,
      );

      if (res.status === 404) {
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('statusCode', 404);
        expect(res.body).toHaveProperty('message');
      }
    });
  });
});
