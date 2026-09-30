import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateProductDto } from '../dto/create-product.dto.js';
import { ProductQueryDto } from '../dto/product-query.dto.js';
import { UpdateProductDto } from '../dto/update-product.dto.js';
import { UpdateStockDto } from '../dto/update-stock.dto.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(@Query() query: ProductQueryDto) {
    return await this.productsService.getProducts(query);
  }

  @Get(':id')
  async getProductById(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.getProductById(id);
  }

  @Post()
  async createProduct(@Body() data: CreateProductDto) {
    return await this.productsService.createProduct(data);
  }

  @Patch(':id')
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateProductDto,
  ) {
    return await this.productsService.updateProduct(id, data);
  }

  @Patch(':id/stock')
  async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateStockDto,
  ) {
    return await this.productsService.updateStock(
      id,
      data.stockQuantity,
    );
  }

  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.deleteProduct(id);
  }
}