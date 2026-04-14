import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import request from 'supertest';
import {
  createTestApp,
  loginUser,
  authRequest,
  TEST_USERS,
  TestUser,
} from './helpers/test-app.helper';

describe('Auth Flow (e2e) — T5-01', () => {
  let app: INestApplication<App>;
  let superadmin: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    superadmin = await loginUser(app, TEST_USERS.superadmin);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ── Login Flow ──

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: TEST_USERS.superadmin.email,
          password: TEST_USERS.superadmin.password,
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user).toHaveProperty('role');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: TEST_USERS.superadmin.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should reject unknown email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'pass' })
        .expect(401);
    });
  });

  // ── Token Refresh ──

  describe('POST /auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const user = await loginUser(app, TEST_USERS.staff);
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  // ── Logout ──

  describe('POST /auth/logout', () => {
    it('should logout and invalidate tokens', async () => {
      const user = await loginUser(app, TEST_USERS.staff);

      await authRequest(app, 'post', '/auth/logout', user).expect(200);

      // Old refresh token should no longer work
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
    });
  });

  // ── RBAC ──

  describe('RBAC — Role-Based Access Control', () => {
    it('should allow superadmin to access admin endpoints', async () => {
      const res = await authRequest(app, 'get', '/settings/users', superadmin);
      expect([200, 403]).not.toContain(res.status === 403 ? 403 : 200);
    });

    it('should enforce auth on protected endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/settings/users')
        .expect(401);
    });
  });

  // ── Account Lockout ──

  describe('Account Lockout (T5-12)', () => {
    it('should lock account after 5 failed attempts', async () => {
      const email = TEST_USERS.staff.email;

      // Login successfully first to reset any prior lockout
      await loginUser(app, TEST_USERS.staff);

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrongpass' })
          .expect(401);
      }

      // 6th attempt should still be 401 but with lockout message
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: TEST_USERS.staff.password });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/terkunci/i);
    });
  });
});
