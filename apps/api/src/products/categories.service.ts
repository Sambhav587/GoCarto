import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { db } from '../prisma/db.js';
import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  async getCategories() {
    return await db.orm.public.Category.all();
  }

  async getCategoryById(id: number) {
    const category = await db.orm.public.Category.first({ id });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async createCategory(data: CreateCategoryDto) {
    try {
      return await db.orm.public.Category.create({
        name: data.name,
        slug: data.slug,
        updatedAt: Temporal.Now.instant(),
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'Category name or slug already exists',
        );
      }

      throw error;
    }
  }

  async updateCategory(id: number, data: UpdateCategoryDto) {
    const category = await db.orm.public.Category.first({ id });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    try {
      return await db.orm.public.Category.where({ id }).update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        updatedAt: Temporal.Now.instant(),
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          'Category name or slug already exists',
        );
      }

      throw error;
    }
  }

  async deleteCategory(id: number) {
    const category = await db.orm.public.Category.first({ id });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return await db.orm.public.Category.where({ id }).delete();
  }
}