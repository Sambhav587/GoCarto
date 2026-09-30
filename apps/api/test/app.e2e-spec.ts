import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { AppModule } from '../src/app.module.js';
import { db } from '../src/prisma/db.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
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

    const unique = Date.now();

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin-e2e-${unique}@example.com`,
        password: 'AdminTest123!',
        name: 'E2E Admin',
        username: `admin-e2e-${unique}`,
      })
      .expect(201);

    const adminUserId = registerResponse.body.id;

    await db.orm.public.User.where({ id: adminUserId }).update({
      role: 'admin',
      updatedAt: Temporal.Now.instant(),
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `admin-e2e-${unique}@example.com`,
        password: 'AdminTest123!',
      })
      .expect(201);

    accessToken = loginResponse.body.accessToken;
  });

  it('GET /users returns users', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /users creates a user', async () => {
    const email = `test-${Date.now()}@example.com`;
    const username = `testuser${Date.now()}`;

    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email,
        name: 'Test User',
        username,
      })
      .expect(201);

    expect(response.body.email).toBe(email);
    expect(response.body.name).toBe('Test User');
    expect(response.body.username).toBe(username);
  });

  it('PATCH /users/:id updates a user', async () => {
    const email = `patch-${Date.now()}@example.com`;
    const username = `patchuser${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email,
        name: 'Patch User',
        username,
      })
      .expect(201);

    const userId = created.body.id;

    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated User',
      })
      .expect(200);

    expect(response.body.id).toBe(userId);
    expect(response.body.name).toBe('Updated User');
    expect(response.body.email).toBe(email);
    expect(response.body.username).toBe(username);
  });

  it('DELETE /users/:id deletes a user', async () => {
    const email = `delete-${Date.now()}@example.com`;
    const username = `deleteuser${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email,
        name: 'Delete User',
        username,
      })
      .expect(201);

    const userId = created.body.id;

    await request(app.getHttpServer())
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('POST /users rejects an invalid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: 'not-an-email',
        name: 'Invalid User',
        username: `invalid${Date.now()}`,
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  it('POST /users rejects a request without an email', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'No Email User',
        username: `noemail${Date.now()}`,
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  it('GET /users/:id returns 404 for a non-existent user', async () => {
    const nonExistentId = 999999999;

    const response = await request(app.getHttpServer())
      .get(`/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(response.body.message).toBe(
      `User with id ${nonExistentId} not found`,
    );
  });

  it('PATCH /users/:id returns 404 for a non-existent user', async () => {
    const nonExistentId = 999999998;

    const response = await request(app.getHttpServer())
      .patch(`/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated User',
      })
      .expect(404);

    expect(response.body.message).toBe(
      `User with id ${nonExistentId} not found`,
    );
  });

  it('DELETE /users/:id returns 404 for a non-existent user', async () => {
    const nonExistentId = 999999997;

    const response = await request(app.getHttpServer())
      .delete(`/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(response.body.message).toBe(
      `User with id ${nonExistentId} not found`,
    );
  });

  it('POST /users rejects a duplicate email', async () => {
    const email = `duplicate-${Date.now()}@example.com`;
    const username = `duplicate${Date.now()}`;

    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email,
        name: 'Duplicate User',
        username,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email,
        name: 'Duplicate User Again',
        username: `${username}again`,
      })
      .expect(409);

    expect(response.body.message).toBe('Email already exists');

    await request(app.getHttpServer())
      .delete(`/users/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('GET /users/:id rejects a non-numeric id', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/abc')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  it('PATCH /users/:id rejects a non-numeric id', async () => {
    const response = await request(app.getHttpServer())
      .patch('/users/abc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Invalid ID',
      })
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  it('DELETE /users/:id rejects a non-numeric id', async () => {
    const response = await request(app.getHttpServer())
      .delete('/users/abc')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(response.body.statusCode).toBe(400);
  });

  afterEach(async () => {
    await app.close();
  });
});