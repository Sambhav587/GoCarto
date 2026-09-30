import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let categoryId: number;
  let productId: number;

  const timestamp = Date.now();

  const category = {
    name: `Test Category ${timestamp}`,
    slug: `test-category-${timestamp}`,
  };

  const product = {
    name: `Milk ${timestamp}`,
    slug: `milk-${timestamp}`,
    description: 'Fresh milk',
    price: 6500,
    unit: '1 litre',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

    const categoryResponse = await request(app.getHttpServer())
      .post('/categories')
      .send(category)
      .expect(201);

    categoryId = categoryResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products should return an array', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /products should create a product', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .send({
        ...product,
        categoryId,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      unit: product.unit,
      isActive: true,
      stockQuantity: 0,
    });

    expect(response.body.id).toEqual(expect.any(Number));

    productId = response.body.id;
  });

  it('GET /products/:id should return the created product', async () => {
    const response = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: productId,
      categoryId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      unit: product.unit,
      stockQuantity: 0,
    });
  });

  it('GET /products/:id should return 404 for a missing product', async () => {
    await request(app.getHttpServer())
      .get('/products/999999999')
      .expect(404);
  });

  it('GET /products?search=Milk should filter products by name', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({
        search: 'Milk',
      })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(
      response.body.some(
        (item: { id: number }) => item.id === productId,
      ),
    ).toBe(true);
  });

  it('GET /products?categoryId should filter products by category', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({
        categoryId,
      })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(
      response.body.some(
        (item: { id: number; categoryId: number }) =>
          item.id === productId && item.categoryId === categoryId,
      ),
    ).toBe(true);
  });

  it('GET /products?categoryId should reject an invalid category id', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .query({
        categoryId: 'invalid',
      })
      .expect(400);
  });

  it('GET /products?isActive=true should return active products', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({
        isActive: 'true',
      })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(
      response.body.every(
        (item: { isActive: boolean }) => item.isActive === true,
      ),
    ).toBe(true);

    expect(
      response.body.some(
        (item: { id: number }) => item.id === productId,
      ),
    ).toBe(true);
  });

  it('GET /products?isActive=false should return inactive products', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({
        isActive: 'false',
      })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(
      response.body.every(
        (item: { isActive: boolean }) => item.isActive === false,
      ),
    ).toBe(true);
  });

  it('GET /products?isActive=invalid should reject invalid status', async () => {
    await request(app.getHttpServer())
      .get('/products')
      .query({
        isActive: 'invalid',
      })
      .expect(400);
  });

  it('PATCH /products/:id should update the product', async () => {
    const updatedName = `${product.name} Updated`;

    const response = await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .send({
        name: updatedName,
        price: 7000,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: productId,
      name: updatedName,
      price: 7000,
    });
  });

  it('PATCH /products/:id should deactivate the product', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .send({
        isActive: false,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: productId,
      isActive: false,
    });
  });

  it('GET /products?isActive=false should include the deactivated product', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({
        isActive: 'false',
      })
      .expect(200);

    expect(
      response.body.some(
        (item: { id: number }) => item.id === productId,
      ),
    ).toBe(true);
  });

  it('GET /products?isActive=true should exclude the deactivated product', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .query({
        isActive: 'true',
      })
      .expect(200);

    expect(
      response.body.some(
        (item: { id: number }) => item.id === productId,
      ),
    ).toBe(false);
  });

  it('PATCH /products/:id should reactivate the product', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .send({
        isActive: true,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: productId,
      isActive: true,
    });
  });

  it('PATCH /products/:id should return 404 for a missing product', async () => {
    await request(app.getHttpServer())
      .patch('/products/999999999')
      .send({
        name: 'Missing Product',
      })
      .expect(404);
  });

  it('PATCH /products/:id/stock should update stock quantity', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/products/${productId}/stock`)
      .send({
        stockQuantity: 25,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: productId,
      stockQuantity: 25,
    });
  });

  it('PATCH /products/:id/stock should reject negative stock', async () => {
    await request(app.getHttpServer())
      .patch(`/products/${productId}/stock`)
      .send({
        stockQuantity: -1,
      })
      .expect(400);
  });

  it('PATCH /products/:id/stock should reject invalid stock data', async () => {
    await request(app.getHttpServer())
      .patch(`/products/${productId}/stock`)
      .send({
        stockQuantity: 'twenty',
      })
      .expect(400);
  });

  it('PATCH /products/:id/stock should return 404 for a missing product', async () => {
    await request(app.getHttpServer())
      .patch('/products/999999999/stock')
      .send({
        stockQuantity: 10,
      })
      .expect(404);
  });

  it('POST /products should reject invalid data', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'A',
        slug: '',
        categoryId: 0,
        price: 0,
        unit: '',
      })
      .expect(400);
  });

  it('POST /products should reject a missing category', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Bread',
        slug: `bread-${Date.now()}`,
        categoryId: 999999999,
        price: 5000,
        unit: '1 pack',
      })
      .expect(404);
  });

  it('POST /products should reject a duplicate slug', async () => {
    await request(app.getHttpServer())
      .post('/products')
      .send({
        ...product,
        categoryId,
      })
      .expect(409);
  });

  it('DELETE /products/:id should delete the product', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .expect(404);
  });

  it('DELETE /categories/:id should clean up the test category', async () => {
    await request(app.getHttpServer())
      .delete(`/categories/${categoryId}`)
      .expect(200);
  });
});