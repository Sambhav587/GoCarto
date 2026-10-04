import { apiRequest } from './client';

export type CartItem = {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    unit: string;
    stockQuantity: number;
    isActive: boolean;
  };
};

export type Cart = {
  id: number;
  userId: number;
  items: CartItem[];
};

export async function getCart(
  userId: number,
  token: string,
): Promise<Cart> {
  return await apiRequest<Cart>(
    `/v1/users/${userId}/cart`,
    {
      token,
    },
  );
}

export async function addToCart(
  userId: number,
  productId: number,
  quantity: number,
  token: string,
): Promise<Cart> {
  return await apiRequest<Cart>(
    `/v1/users/${userId}/cart/items`,
    {
      method: 'POST',
      token,
      body: {
        productId,
        quantity,
      },
    },
  );
}

export async function updateCartItem(
  userId: number,
  itemId: number,
  quantity: number,
  token: string,
): Promise<Cart> {
  return await apiRequest<Cart>(
    `/v1/users/${userId}/cart/items/${itemId}`,
    {
      method: 'PATCH',
      token,
      body: {
        quantity,
      },
    },
  );
}

export async function removeCartItem(
  userId: number,
  itemId: number,
  token: string,
): Promise<void> {
  await apiRequest<void>(
    `/v1/users/${userId}/cart/items/${itemId}`,
    {
      method: 'DELETE',
      token,
    },
  );
}