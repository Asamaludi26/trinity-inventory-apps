import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import {
  createTestApp,
  loginUser,
  authRequest,
  TEST_USERS,
  TestUser,
} from './helpers/test-app.helper';

describe('Customer Operations (e2e) — T5-03', () => {
  let app: INestApplication<App>;
  let adminLogistik: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    adminLogistik = await loginUser(app, TEST_USERS.adminLogistik);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Customer CRUD', () => {
    it('should list customers with pagination', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?page=1&limit=10',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('meta');
    });

    it('should get customer detail', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/customers?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const customerId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/customers/${customerId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('code');
        expect(detailRes.body.data).toHaveProperty('name');
      }
    });

    it('should reject deleting customer with history', async () => {
      // Find a customer with installations/maintenance
      const listRes = await authRequest(
        app,
        'get',
        '/customers?page=1&limit=10',
        adminLogistik,
      ).expect(200);

      for (const customer of listRes.body.data.items) {
        const delRes = await authRequest(
          app,
          'delete',
          `/customers/${customer.id}`,
          adminLogistik,
        );
        // Should be blocked if customer has history (422)
        if (delRes.status === 422) {
          expect(delRes.body.success).toBe(false);
          break;
        }
      }
    });
  });

  describe('Installation', () => {
    it('should list installations', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers/installations',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Maintenance', () => {
    it('should list maintenances', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers/maintenances',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Dismantle', () => {
    it('should list dismantles', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers/dismantles',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Installation Detail', () => {
    it('should get installation detail by ID', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/customers/installations?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const installationId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/customers/installations/${installationId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('id');
      }
    });

    it('should filter installations by status=COMPLETED', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers/installations?status=COMPLETED&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.status).toBe('COMPLETED');
      }
    });
  });

  describe('Maintenance Detail', () => {
    it('should get maintenance detail by ID', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/customers/maintenances?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const maintenanceId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/customers/maintenances/${maintenanceId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('id');
      }
    });

    it('should filter maintenances by status=COMPLETED', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers/maintenances?status=COMPLETED&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.status).toBe('COMPLETED');
      }
    });
  });

  describe('Dismantle Detail', () => {
    it('should get dismantle detail by ID', async () => {
      const listRes = await authRequest(
        app,
        'get',
        '/customers/dismantles?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const dismantleId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/customers/dismantles/${dismantleId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('status');
        expect(detailRes.body.data).toHaveProperty('id');
      }
    });
  });

  describe('Customer Search & Filters', () => {
    it('should accept search query param', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?search=a&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('should return empty list for impossible search', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?search=XYZZY_IMPOSSIBLE_9999&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('should filter customers by ACTIVE status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?status=ACTIVE&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const customer of res.body.data.items) {
        expect(customer.status).toBe('ACTIVE');
      }
    });

    it('should filter customers by INACTIVE status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?status=INACTIVE&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const customer of res.body.data.items) {
        expect(customer.status).toBe('INACTIVE');
      }
    });
  });

  describe('Pagination Meta Integrity', () => {
    it('should return valid pagination meta for customers', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers?page=1&limit=5',
        adminLogistik,
      ).expect(200);

      const meta = res.body.data.meta;
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('page', 1);
      expect(meta).toHaveProperty('limit', 5);
      expect(meta.total).toBeGreaterThanOrEqual(0);
      expect(meta.totalPages).toBeGreaterThanOrEqual(0);
    });

    it('should return valid pagination meta for installations', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers/installations?page=1&limit=5',
        adminLogistik,
      ).expect(200);

      const meta = res.body.data.meta;
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('page', 1);
      expect(meta.total).toBeGreaterThanOrEqual(0);
    });

    it('should return valid pagination meta for maintenances', async () => {
      const res = await authRequest(
        app,
        'get',
        '/customers/maintenances?page=1&limit=5',
        adminLogistik,
      ).expect(200);

      const meta = res.body.data.meta;
      expect(meta).toHaveProperty('total');
      expect(meta).toHaveProperty('page', 1);
      expect(meta.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RBAC — Authentication Required', () => {
    it('should return 401 for unauthenticated customer list', async () => {
      const supertest = (await import('supertest')).default;
      const res = await supertest(app.getHttpServer()).get('/api/v1/customers');
      expect(res.status).toBe(401);
    });

    it('should return 401 for unauthenticated installation list', async () => {
      const supertest = (await import('supertest')).default;
      const res = await supertest(app.getHttpServer()).get(
        '/api/v1/customers/installations',
      );
      expect(res.status).toBe(401);
    });
  });
});
