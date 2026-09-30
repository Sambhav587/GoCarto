import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  const unique = Date.now();

  const email = `auth-e2e-${unique}@example.com`;
  const password = 'StrongPassword123!';
  const username = `auth-e2e-${unique}`;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register creates a customer account', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Auth E2E User',
        username,
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.email).toBe(email);
    expect(response.body.name).toBe('Auth E2E User');
    expect(response.body.username).toBe(username);
    expect(response.body.role).toBe('customer');

    expect(response.body.passwordHash).toBeUndefined();
  });

  it('POST /auth/register rejects a duplicate email', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        name: 'Duplicate User',
        username: `duplicate-${unique}`,
      })
      .expect(409);

    expect(response.body.message).toBe(
      'Email is already registered',
    );
  });

  it('POST /auth/login returns an access token for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(typeof response.body.accessToken).toBe('string');

    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.role).toBe('customer');

    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('POST /auth/login rejects an invalid password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  it('POST /auth/login rejects a non-existent user', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `missing-${unique}@example.com`,
        password,
      })
      .expect(401);
  });

  it('GET /auth/me rejects requests without authentication', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);
  });

  it('GET /auth/me returns the authenticated user from a valid token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.sub).toBeDefined();
    expect(response.body.email).toBe(email);
    expect(response.body.role).toBe('customer');
  });

  it('GET /auth/me rejects an invalid token', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});