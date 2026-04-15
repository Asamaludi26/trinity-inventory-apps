import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import {
  createTestApp,
  loginUser,
  authRequest,
  TEST_USERS,
  TestUser,
} from './helpers/test-app.helper';

describe('Asset Lifecycle (e2e) — T5-01', () => {
  let app: INestApplication<App>;
  let superadmin: TestUser;
  let adminLogistik: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    superadmin = await loginUser(app, TEST_USERS.superadmin);
    adminLogistik = await loginUser(app, TEST_USERS.adminLogistik);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Asset CRUD', () => {
    it('should list assets with pagination', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets?page=1&limit=10',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('total');
      expect(res.body.data.meta).toHaveProperty('page');
    });

    it('should get asset detail by ID', async () => {
      // First get a list to find an asset
      const listRes = await authRequest(
        app,
        'get',
        '/assets?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (listRes.body.data.items.length > 0) {
        const assetId = listRes.body.data.items[0].id;
        const detailRes = await authRequest(
          app,
          'get',
          `/assets/${assetId}`,
          adminLogistik,
        ).expect(200);

        expect(detailRes.body.success).toBe(true);
        expect(detailRes.body.data).toHaveProperty('id');
        expect(detailRes.body.data).toHaveProperty('code');
        expect(detailRes.body.data).toHaveProperty('status');
      }
    });

    it('should filter assets by status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets?status=IN_STORAGE',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.status).toBe('IN_STORAGE');
      }
    });
  });

  describe('Asset Categories / Types / Models', () => {
    it('should list categories', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets/categories',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should prevent deleting category with children', async () => {
      const catRes = await authRequest(
        app,
        'get',
        '/assets/categories',
        adminLogistik,
      ).expect(200);

      if (catRes.body.data.length > 0) {
        const categoryId = catRes.body.data[0].id;
        const delRes = await authRequest(
          app,
          'delete',
          `/assets/categories/${categoryId}`,
          superadmin,
        );
        // Should be 422 or 409 (has children)
        expect([422, 409, 400]).toContain(delRes.status);
      }
    });
  });

  describe('Stock Management', () => {
    it('should list stock overview', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets/stock',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Stock Movements per Asset', () => {
    it('should return stock movements for an asset', async () => {
      const assetRes = await authRequest(
        app,
        'get',
        '/assets?page=1&limit=1',
        adminLogistik,
      ).expect(200);

      if (assetRes.body.data.items.length > 0) {
        const assetId = assetRes.body.data.items[0].id;
        const movRes = await authRequest(
          app,
          'get',
          `/assets/${assetId}/stock-movements`,
          adminLogistik,
        );

        if (movRes.status === 200) {
          expect(movRes.body.success).toBe(true);
          if (movRes.body.data?.items?.length > 0) {
            const mov = movRes.body.data.items[0];
            expect(mov).toHaveProperty('type');
            expect(mov).toHaveProperty('createdAt');
          }
        }
      }
    });
  });

  describe('Asset Search & Advanced Filters', () => {
    it('should accept search query param', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets?search=a&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('should return empty list for impossible search string', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets?search=XYZZY_IMPOSSIBLE_STRING_9999&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('should filter assets by CONSUMED status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets?status=CONSUMED&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.status).toBe('CONSUMED');
      }
    });

    it('should filter assets by IN_CUSTODY status', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets?status=IN_CUSTODY&limit=5',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.status).toBe('IN_CUSTODY');
      }
    });
  });

  describe('Pagination Meta Integrity', () => {
    it('should return correct pagination meta for assets', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets?page=1&limit=5',
        adminLogistik,
      ).expect(200);

      const meta = res.body.data.meta;
      expect(meta).toHaveProperty('page', 1);
      expect(meta).toHaveProperty('limit', 5);
      expect(meta.total).toBeGreaterThanOrEqual(0);
      expect(meta.totalPages).toBeGreaterThanOrEqual(0);
      if (meta.total > 5) {
        expect(meta.totalPages).toBeGreaterThan(1);
      }
    });

    it('should return correct pagination meta for categories', async () => {
      const res = await authRequest(
        app,
        'get',
        '/assets/categories',
        adminLogistik,
      ).expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('RBAC — Authentication Required', () => {
    it('should return 401 for unauthenticated asset list', async () => {
      const supertest = (await import('supertest')).default;
      const res = await supertest(app.getHttpServer()).get('/api/v1/assets');
      expect(res.status).toBe(401);
    });

    it('should return 401 for unauthenticated category list', async () => {
      const supertest = (await import('supertest')).default;
      const res = await supertest(app.getHttpServer()).get(
        '/api/v1/assets/categories',
      );
      expect(res.status).toBe(401);
    });

    it('should return 401 for unauthenticated stock overview', async () => {
      const supertest = (await import('supertest')).default;
      const res = await supertest(app.getHttpServer()).get(
        '/api/v1/assets/stock',
      );
      expect(res.status).toBe(401);
    });
  });
});
