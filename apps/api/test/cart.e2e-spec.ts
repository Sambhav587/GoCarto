import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

describe('Cart API (e2e)', () => {
  let app: INestApplication;
  let userId: number;
  let accessToken: string;
  let productId: number;

  const unique = Date.now();
  const password = 'CartTestPassword123!';

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

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `cart-test-${unique}@example.com`,
        password,
        name: 'Cart Test User',
        username: `cart-test-${unique}`,
      })
      .expect(201);

    userId = userResponse.body.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `cart-test-${unique}@example.com`,
        password,
      })
      .expect(201);

    accessToken = loginResponse.body.accessToken;

    const categoryResponse = await request(app.getHttpServer())
      .post('/categories')
      .send({
        name: `Cart Test Category ${unique}`,
        slug: `cart-test-category-${unique}`,
      })
      .expect(201);

    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .send({
        categoryId: categoryResponse.body.id,
        name: `Cart Test Product ${unique}`,
        slug: `cart-test-product-${unique}`,
        description: 'Product used for cart e2e tests',
        price: 100,
        unit: 'piece',
      })
      .expect(201);

    productId = productResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users/:userId/cart returns an empty cart initially', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/cart`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.userId).toBe(userId);
    expect(response.body.items).toEqual([]);
  });

  it('POST /users/:userId/cart/items adds a product to the cart', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/cart/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId,
        quantity: 2,
      })
      .expect(201);
  });

  it('GET /users/:userId/cart returns the added item', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/cart`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.userId).toBe(userId);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].productId).toBe(productId);
    expect(response.body.items[0].quantity).toBe(2);
  });

  it('POST /users/:userId/cart/items increases quantity for an existing product', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/cart/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId,
        quantity: 3,
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/cart`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity).toBe(5);
  });

  it('PATCH /users/:userId/cart/items/:productId updates quantity', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/cart/items/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        quantity: 2,
      })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/cart`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity).toBe(2);
  });

  it('PATCH /users/:userId/cart/items/:productId rejects invalid quantity', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/cart/items/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        quantity: 0,
      })
      .expect(400);
  });

  it('PATCH /users/:userId/cart/items/:productId returns 404 for missing item', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/cart/items/999999999`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        quantity: 2,
      })
      .expect(404);
  });

  it('POST /users/:userId/cart/items rejects an invalid product', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/cart/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId: 999999999,
        quantity: 1,
      })
      .expect(404);
  });

  it('POST /users/:userId/cart/items rejects invalid quantity', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/cart/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId,
        quantity: 0,
      })
      .expect(400);
  });

  it('POST /users/:userId/cart/items rejects invalid productId', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/cart/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId: 'invalid',
        quantity: 1,
      })
      .expect(400);
  });

  it('DELETE /users/:userId/cart/items/:productId removes the item', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${userId}/cart/items/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/cart`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.items).toEqual([]);
  });

  it('DELETE /users/:userId/cart/items/:productId returns 404 for missing item', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${userId}/cart/items/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});