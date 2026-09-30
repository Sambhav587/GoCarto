import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { AppModule } from '../src/app.module.js';
import { db } from '../src/prisma/db.js';

describe('Order API (e2e)', () => {
  let app: INestApplication;

  let userId: number;
  let accessToken: string;

  let adminUserId: number;
  let adminAccessToken: string;

  let categoryId: number;
  let productId: number;
  let orderId: number;

  const unique = Date.now();
  const password = 'OrderTestPassword123!';

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

    // Create customer test user.
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `order-test-${unique}@example.com`,
        password,
        name: 'Order Test User',
        username: `order-test-${unique}`,
      })
      .expect(201);

    userId = userResponse.body.id;

    // Login as customer.
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `order-test-${unique}@example.com`,
        password,
      })
      .expect(201);

    accessToken = loginResponse.body.accessToken;

    // Create admin test user.
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `order-admin-${unique}@example.com`,
        password,
        name: 'Order Admin User',
        username: `order-admin-${unique}`,
      })
      .expect(201);

    adminUserId = adminResponse.body.id;

    // Promote only this E2E fixture user to admin.
    await db.orm.public.User.where({
      id: adminUserId,
    }).update({
      role: 'admin',
      updatedAt: Temporal.Now.instant(),
    });

    // Login again so the JWT contains role=admin.
    const adminLoginResponse = await request(
      app.getHttpServer(),
    )
      .post('/auth/login')
      .send({
        email: `order-admin-${unique}@example.com`,
        password,
      })
      .expect(201);

    adminAccessToken = adminLoginResponse.body.accessToken;

    const categoryResponse = await request(app.getHttpServer())
      .post('/categories')
      .send({
        name: `Order Test Category ${unique}`,
        slug: `order-test-category-${unique}`,
      })
      .expect(201);

    categoryId = categoryResponse.body.id;

    const productResponse = await request(app.getHttpServer())
      .post('/products')
      .send({
        categoryId,
        name: `Order Test Product ${unique}`,
        slug: `order-test-product-${unique}`,
        description: 'Product used for order e2e tests',
        price: 200,
        unit: 'piece',
      })
      .expect(201);

    productId = productResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/products/${productId}/stock`)
      .send({
        stockQuantity: 10,
      })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users/:userId/orders rejects an empty cart', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryAddress: '123 Test Street, New Delhi',
        paymentMethod: 'cod',
      })
      .expect(400);
  });

  it('POST /users/:userId/cart/items adds a product for checkout', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/cart/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId,
        quantity: 2,
      })
      .expect(201);
  });

  it('POST /users/:userId/orders rejects an invalid delivery address', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryAddress: 'short',
        paymentMethod: 'cod',
      })
      .expect(400);
  });

  it('POST /users/:userId/orders rejects an invalid payment method', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryAddress: '123 Test Street, New Delhi',
        paymentMethod: 'bitcoin',
      })
      .expect(400);
  });

  it('POST /users/:userId/orders creates an order from the cart', async () => {
    const response = await request(app.getHttpServer())
      .post(`/users/${userId}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryAddress: '123 Test Street, New Delhi',
        paymentMethod: 'upi',
      })
      .expect(201);

    orderId = response.body.id;

    expect(orderId).toBeDefined();
    expect(response.body.userId).toBe(userId);
    expect(response.body.status).toBe('pending');
    expect(response.body.paymentStatus).toBe('pending');
    expect(response.body.paymentMethod).toBe('upi');
    expect(response.body.deliveryAddress).toBe(
      '123 Test Street, New Delhi',
    );

    expect(response.body.subtotal).toBe(400);
    expect(response.body.deliveryFee).toBe(40);
    expect(response.body.total).toBe(440);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toEqual({
      productId,
      quantity: 2,
      unitPrice: 200,
    });
  });

  it('GET /users/:userId/orders returns the user orders', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(orderId);
    expect(response.body[0].userId).toBe(userId);
    expect(response.body[0].items).toHaveLength(1);
    expect(response.body[0].items[0].productId).toBe(productId);
  });

  it('GET /users/:userId/orders/:orderId returns the order details', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.id).toBe(orderId);
    expect(response.body.userId).toBe(userId);
    expect(response.body.status).toBe('pending');
    expect(response.body.subtotal).toBe(400);
    expect(response.body.deliveryFee).toBe(40);
    expect(response.body.total).toBe(440);
    expect(response.body.items).toHaveLength(1);
  });

  it('PATCH /users/:userId/orders/:orderId/status changes pending to confirmed', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'confirmed',
      })
      .expect(200);

    expect(response.body.status).toBe('confirmed');
  });

  it('PATCH /users/:userId/orders/:orderId/status changes confirmed to preparing', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'preparing',
      })
      .expect(200);

    expect(response.body.status).toBe('preparing');
  });

  it('PATCH /users/:userId/orders/:orderId/status changes preparing to out_for_delivery', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'out_for_delivery',
      })
      .expect(200);

    expect(response.body.status).toBe('out_for_delivery');
  });

  it('PATCH /users/:userId/orders/:orderId/status changes out_for_delivery to delivered', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'delivered',
      })
      .expect(200);

    expect(response.body.status).toBe('delivered');
  });

  it('PATCH /users/:userId/orders/:orderId/status rejects an invalid transition', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'cancelled',
      })
      .expect(400);
  });

  it('PATCH /users/:userId/orders/:orderId/status rejects an invalid status value', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'unknown_status',
      })
      .expect(400);
  });

  it('PATCH /users/:userId/orders/:orderId/status returns 404 for an unknown order', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/999999999/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'confirmed',
      })
      .expect(404);
  });

  it('PATCH /users/:userId/orders/:orderId/status rejects an unknown user', async () => {
  await request(app.getHttpServer())
    .patch(`/users/999999999/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .send({
      status: 'confirmed',
    })
    .expect(400);
});

  it('PATCH /users/:userId/orders/:orderId/status rejects an invalid orderId', async () => {
    await request(app.getHttpServer())
      .patch(`/users/${userId}/orders/invalid/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        status: 'confirmed',
      })
      .expect(400);
  });

  it('GET /users/:userId/orders/:orderId returns 404 for an unknown order', async () => {
    await request(app.getHttpServer())
      .get(`/users/${userId}/orders/999999999`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('GET /users/:userId/orders/:orderId rejects an unknown user', async () => {
    await request(app.getHttpServer())
      .get(`/users/999999999/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /users/:userId/orders/:orderId rejects an invalid orderId', async () => {
    await request(app.getHttpServer())
      .get(`/users/${userId}/orders/invalid`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('GET /users/:userId/orders rejects an unknown user', async () => {
    await request(app.getHttpServer())
      .get('/users/999999999/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /users/:userId/cart is empty after order creation', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/cart`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.items).toEqual([]);
  });

  it('GET /products/:id shows stock reduced after order creation', async () => {
    const response = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200);

    expect(response.body.stockQuantity).toBe(8);
  });

  it('POST /users/:userId/orders rejects an order when stock is insufficient', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/cart/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        productId,
        quantity: 20,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/users/${userId}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryAddress: '123 Test Street, New Delhi',
        paymentMethod: 'cod',
      })
      .expect(400);
  });

  it('POST /users/:userId/orders rejects an unknown user', async () => {
    await request(app.getHttpServer())
      .post('/users/999999999/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryAddress: '123 Test Street, New Delhi',
        paymentMethod: 'cod',
      })
      .expect(403);
  });

  it('POST /users/:userId/orders rejects an unexpected field', async () => {
    await request(app.getHttpServer())
      .post(`/users/${userId}/orders`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        deliveryAddress: '123 Test Street, New Delhi',
        paymentMethod: 'cod',
        unexpectedField: true,
      })
      .expect(400);
  });
});