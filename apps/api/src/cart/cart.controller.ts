import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AddCartItemDto } from '../dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto.js';
import { CartService } from './cart.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('users/:userId/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private verifyOwnership(
    userId: number,
    request: AuthenticatedRequest,
  ) {
    if (request.user.sub !== userId) {
      throw new ForbiddenException(
        "You cannot access another user's cart",
      );
    }
  }

  @Get()
  async getCart(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    this.verifyOwnership(userId, request);

    return await this.cartService.getCart(userId);
  }

  @Post('items')
  async addItem(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: AddCartItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.verifyOwnership(userId, request);

    return await this.cartService.addItem(userId, data);
  }

  @Patch('items/:productId')
  async updateItem(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() data: UpdateCartItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.verifyOwnership(userId, request);

    return await this.cartService.updateItem(userId, productId, data);
  }

  @Delete('items/:productId')
  async removeItem(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    this.verifyOwnership(userId, request);

    return await this.cartService.removeItem(userId, productId);
  }
}