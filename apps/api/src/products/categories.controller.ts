import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/update-category.dto.js';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  async getCategories() {
    return await this.categoriesService.getCategories();
  }

  @Get(':id')
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.categoriesService.getCategoryById(id);
  }

  @Post()
  async createCategory(@Body() data: CreateCategoryDto) {
    return await this.categoriesService.createCategory(data);
  }

  @Patch(':id')
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(id, data);
  }

  @Delete(':id')
  async deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return await this.categoriesService.deleteCategory(id);
  }
}