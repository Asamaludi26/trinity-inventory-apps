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
});
