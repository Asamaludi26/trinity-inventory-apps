import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { ResponseTransformInterceptor } from '../../src/common/interceptors/response-transform.interceptor';
import request from 'supertest';
import { App } from 'supertest/types';

export interface TestUser {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}

export const TEST_USERS = {
  superadmin: { email: 'admin@trinity.com', password: 'Trinity@2026' },
  adminLogistik: { email: 'logistik@trinity.com', password: 'Trinity@2026' },
  adminPurchase: { email: 'purchase@trinity.com', password: 'Trinity@2026' },
  leader: { email: 'leader@trinity.com', password: 'Trinity@2026' },
  staff: { email: 'staff@trinity.com', password: 'Trinity@2026' },
} satisfies Record<string, TestUser>;

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  await app.init();
  return app;
}

export async function loginUser(
  app: INestApplication<App>,
  user: TestUser,
): Promise<TestUser> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: user.password })
    .expect(200);

  return {
    ...user,
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  };
}

export function authRequest(
  app: INestApplication<App>,
  method: 'get' | 'post' | 'patch' | 'put' | 'delete',
  url: string,
  user: TestUser,
) {
  return request(app.getHttpServer())
    [method](`/api/v1${url}`)
    .set('Authorization', `Bearer ${user.accessToken}`);
}
