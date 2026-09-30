import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { db } from '../prisma/db.js';
import { CreateProductDto } from '../dto/create-product.dto.js';
import { ProductQueryDto } from '../dto/product-query.dto.js';
import { UpdateProductDto } from '../dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  async getProducts(query: ProductQueryDto) {
    let queryBuilder = db.orm.public.Product;

    if (query.categoryId !== undefined) {
      queryBuilder = queryBuilder.where((product) =>
        product.categoryId.eq(Number(query.categoryId)),
      );
    }

    const search = query.search?.trim();

    if (search) {
      queryBuilder = queryBuilder.where((product) =>
        product.name.ilike(`%${search}%`),
      );
    }

    if (query.isActive !== undefined) {
      queryBuilder = queryBuilder.where((product) =>
        product.isActive.eq(query.isActive === 'true'),
      );
    }

    return await queryBuilder
      .orderBy([
        (product) => product.createdAt.desc(),
        (product) => product.id.desc(),
      ])
      .limit(20)
      .all();
  }

  async getProductById(id: number) {
    const product = await db.orm.public.Product.first({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async createProduct(data: CreateProductDto) {
    try {
      const category = await db.orm.public.Category.first({
        id: data.categoryId,
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${data.categoryId} not found`,
        );
      }

      return await db.orm.public.Product.create({
        categoryId: data.categoryId,
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        price: data.price,
        unit: data.unit,
        isActive: true,
        updatedAt: Temporal.Now.instant(),
      });
    } catch (error: any) {
      if (
        error?.code === '23505' ||
        error?.constraint === 'Product_slug_key'
      ) {
        throw new ConflictException('Product slug already exists');
      }

      throw error;
    }
  }

  async updateProduct(id: number, data: UpdateProductDto) {
    const product = await db.orm.public.Product.first({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    if (data.categoryId !== undefined) {
      const category = await db.orm.public.Category.first({
        id: data.categoryId,
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${data.categoryId} not found`,
        );
      }
    }

    try {
      return await db.orm.public.Product.where({ id }).update({
        ...(data.categoryId !== undefined && {
          categoryId: data.categoryId,
        }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.isActive !== undefined && {
          isActive: data.isActive,
        }),
        updatedAt: Temporal.Now.instant(),
      });
    } catch (error: any) {
      if (
        error?.code === '23505' ||
        error?.constraint === 'Product_slug_key'
      ) {
        throw new ConflictException('Product slug already exists');
      }

      throw error;
    }
  }

  async updateStock(id: number, stockQuantity: number) {
    const product = await db.orm.public.Product.first({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return await db.orm.public.Product.where({ id }).update({
      stockQuantity,
      updatedAt: Temporal.Now.instant(),
    });
  }

  async deleteProduct(id: number) {
    const product = await db.orm.public.Product.first({ id });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return await db.orm.public.Product.where({ id }).delete();
  }
}