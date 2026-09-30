import {
  Body,
  Controller,
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
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateOrderDto } from '../dto/create-order.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { OrderService } from './order.service.js';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
  };
}

@Controller('users/:userId/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private verifyOwnership(
    userId: number,
    request: AuthenticatedRequest,
  ) {
    if (request.user.sub !== userId) {
      throw new ForbiddenException(
        "You cannot access another user's orders",
      );
    }
  }

  @Post()
  async createOrder(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() data: CreateOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.verifyOwnership(userId, request);

    return await this.orderService.createOrder(userId, data);
  }

  @Get()
  async getOrders(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    this.verifyOwnership(userId, request);

    return await this.orderService.getOrders(userId);
  }

  @Get(':orderId')
  async getOrderById(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    this.verifyOwnership(userId, request);

    return await this.orderService.getOrderById(userId, orderId);
  }

  @Patch(':orderId/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'delivery')
  async updateOrderStatus(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() data: UpdateOrderStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.orderService.updateOrderStatus(
      userId,
      orderId,
      data,
      true,
    );
  }
}