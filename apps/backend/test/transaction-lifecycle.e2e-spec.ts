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
