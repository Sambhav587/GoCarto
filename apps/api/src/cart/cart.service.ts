import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import 'temporal-polyfill/full/global';
import { Temporal } from 'temporal-polyfill/full';

import { db } from '../prisma/db.js';
import { AddCartItemDto } from '../dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto.js';

@Injectable()
export class CartService {
  async getCart(userId: number) {
    const cart = await db.orm.public.Cart.first({ userId });

    if (!cart) {
      return {
        id: null,
        userId,
        items: [],
      };
    }

    const items = await db.orm.public.CartItem.where({
      cartId: cart.id,
    }).all();

    return {
      ...cart,
      items,
    };
  }

  async addItem(userId: number, data: AddCartItemDto) {
    const product = await db.orm.public.Product.first({
      id: data.productId,
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id ${data.productId} not found`,
      );
    }

    if (!product.isActive) {
      throw new NotFoundException(
        `Product with id ${data.productId} is not available`,
      );
    }

    let cart = await db.orm.public.Cart.first({ userId });

    if (!cart) {
      cart = await db.orm.public.Cart.create({
        userId,
        updatedAt: Temporal.Now.instant(),
      });
    }

    const existingItem = await db.orm.public.CartItem.first({
      cartId: cart.id,
      productId: data.productId,
    });

    if (existingItem) {
      return await db.orm.public.CartItem.where({
        id: existingItem.id,
      }).update({
        quantity: existingItem.quantity + data.quantity,
        updatedAt: Temporal.Now.instant(),
      });
    }

    return await db.orm.public.CartItem.create({
      cartId: cart.id,
      productId: data.productId,
      quantity: data.quantity,
      updatedAt: Temporal.Now.instant(),
    });
  }

  async updateItem(
    userId: number,
    productId: number,
    data: UpdateCartItemDto,
  ) {
    const cart = await db.orm.public.Cart.first({ userId });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await db.orm.public.CartItem.first({
      cartId: cart.id,
      productId,
    });

    if (!item) {
      throw new NotFoundException(
        `Product with id ${productId} is not in the cart`,
      );
    }

    return await db.orm.public.CartItem.where({
      id: item.id,
    }).update({
      quantity: data.quantity,
      updatedAt: Temporal.Now.instant(),
    });
  }

  async removeItem(userId: number, productId: number) {
    const cart = await db.orm.public.Cart.first({ userId });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await db.orm.public.CartItem.first({
      cartId: cart.id,
      productId,
    });

    if (!item) {
      throw new NotFoundException(
        `Product with id ${productId} is not in the cart`,
      );
    }

    return await db.orm.public.CartItem.where({
      id: item.id,
    }).delete();
  }
}