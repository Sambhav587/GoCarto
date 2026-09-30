import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { CreateOrderDto } from '../dto/create-order.dto.js';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class OrderService {
  async createOrder(userId: number, data: CreateOrderDto) {
    return await db.transaction(async (tx) => {
      const user = await tx.orm.public.User.first({ id: userId });

      if (!user) {
        throw new NotFoundException(
          `User with id ${userId} not found`,
        );
      }

      const cart = await tx.orm.public.Cart.first({ userId });

      if (!cart) {
        throw new BadRequestException('Cart is empty');
      }

      const cartItems = await tx.orm.public.CartItem.where({
        cartId: cart.id,
      }).all();

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      let subtotal = 0;

      const orderItems: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
      }> = [];

      for (const cartItem of cartItems) {
        const product = await tx.orm.public.Product.first({
          id: cartItem.productId,
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id ${cartItem.productId} not found`,
          );
        }

        if (!product.isActive) {
          throw new BadRequestException(
            `Product "${product.name}" is no longer available`,
          );
        }

        if (product.stockQuantity < cartItem.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}"`,
          );
        }

        subtotal += product.price * cartItem.quantity;

        orderItems.push({
          productId: product.id,
          quantity: cartItem.quantity,
          unitPrice: product.price,
        });
      }

      const deliveryFee = subtotal >= 500 ? 0 : 40;
      const total = subtotal + deliveryFee;

      const order = await tx.orm.public.Order.create({
        userId,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: data.paymentMethod ?? 'cod',
        deliveryAddress: data.deliveryAddress,
        subtotal,
        deliveryFee,
        total,
        updatedAt: Temporal.Now.instant(),
      });

      for (const item of orderItems) {
        await tx.orm.public.OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });

        const product = await tx.orm.public.Product.first({
          id: item.productId,
        });

        if (!product) {
          throw new NotFoundException(
            `Product with id ${item.productId} not found`,
          );
        }

        await tx.orm.public.Product.where({
          id: item.productId,
        }).update({
          stockQuantity: product.stockQuantity - item.quantity,
          updatedAt: Temporal.Now.instant(),
        });
      }

      await tx.orm.public.CartItem.where({
        cartId: cart.id,
      }).deleteAll();

      return {
        ...order,
        items: orderItems,
      };
    });
  }

  async getOrders(userId: number) {
    const user = await db.orm.public.User.first({ id: userId });

    if (!user) {
      throw new NotFoundException(
        `User with id ${userId} not found`,
      );
    }

    const orders = await db.orm.public.Order.where({
      userId,
    }).all();

    const results = [];

    for (const order of orders) {
      const items = await db.orm.public.OrderItem.where({
        orderId: order.id,
      }).all();

      results.push({
        ...order,
        items,
      });
    }

    return results;
  }

  async getOrderById(userId: number, orderId: number) {
    const user = await db.orm.public.User.first({ id: userId });

    if (!user) {
      throw new NotFoundException(
        `User with id ${userId} not found`,
      );
    }

    const order = await db.orm.public.Order.first({
      id: orderId,
      userId,
    });

    if (!order) {
      throw new NotFoundException(
        `Order with id ${orderId} not found`,
      );
    }

    const items = await db.orm.public.OrderItem.where({
      orderId: order.id,
    }).all();

    return {
      ...order,
      items,
    };
  }

  async updateOrderStatus(
  userId: number,
  orderId: number,
  data: UpdateOrderStatusDto,
  allowCrossUserAccess = false,
) {
  const order = allowCrossUserAccess
    ? await db.orm.public.Order.first({ id: orderId })
    : await db.orm.public.Order.first({
        id: orderId,
        userId,
      });

  if (!order) {
    throw new NotFoundException(
      `Order with id ${orderId} not found`,
    );
  }

  const allowedTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  const allowedNextStatuses =
    allowedTransitions[order.status] ?? [];

  if (!allowedNextStatuses.includes(data.status)) {
    throw new BadRequestException(
      `Cannot change order status from "${order.status}" to "${data.status}"`,
    );
  }

  return await db.orm.public.Order.where({
    id: orderId,
  }).update({
    status: data.status,
    updatedAt: Temporal.Now.instant(),
  });
  }
}