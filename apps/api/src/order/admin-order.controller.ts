import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { OrderService } from './order.service.js';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Get()
  async getAllOrders() {
    return await this.orderService.getAllOrders();
  }

  @Patch(':orderId/status')
  async updateOrderStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() data: UpdateOrderStatusDto,
  ) {
    return await this.orderService.updateOrderStatus(
      0,
      orderId,
      data,
      true,
    );
  }
}