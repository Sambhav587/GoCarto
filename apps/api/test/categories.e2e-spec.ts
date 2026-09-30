import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

describe('Categories API (e2e)', () => {
  let app: INestApplication;
  let categoryId: number;

  const category = {
    name: `Fruits ${Date.now()}`,
    slug: `fruits-${Date.now()}`,
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /categories should return an array', async () => {
    const response = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('POST /categories should create a category', async () => {
    const response = await request(app.getHttpServer())
      .post('/categories')
      .send(category)
      .expect(201);

    expect(response.body).toMatchObject({
      name: category.name,
      slug: category.slug,
    });

    expect(response.body.id).toEqual(expect.any(Number));

    categoryId = response.body.id;
  });

  it('GET /categories/:id should return the created category', async () => {
    const response = await request(app.getHttpServer())
      .get(`/categories/${categoryId}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: categoryId,
      name: category.name,
      slug: category.slug,
    });
  });

  it('PATCH /categories/:id should update the category', async () => {
    const updatedName = `${category.name} Updated`;

    const response = await request(app.getHttpServer())
      .patch(`/categories/${categoryId}`)
      .send({
        name: updatedName,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: categoryId,
      name: updatedName,
      slug: category.slug,
    });
  });

  it('POST /categories should reject invalid data', async () => {
    await request(app.getHttpServer())
      .post('/categories')
      .send({
        name: 'A',
        slug: '',
      })
      .expect(400);
  });

  it('DELETE /categories/:id should delete the category', async () => {
    await request(app.getHttpServer())
      .delete(`/categories/${categoryId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/categories/${categoryId}`)
      .expect(404);
  });
});