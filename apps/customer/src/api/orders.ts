import { apiRequest } from './client';

export type PaymentMethod =
  | 'cod'
  | 'card'
  | 'upi';

export type OrderItem = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: number;
  userId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: string;
  latitude: number | null;
  longitude: number | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  deliveryAddress: string;
  latitude?: number;
  longitude?: number;
  paymentMethod?: PaymentMethod;
};

export async function createOrder(
  userId: number,
  data: CreateOrderInput,
  token: string,
): Promise<Order> {
  return await apiRequest<Order>(
    `/v1/users/${userId}/orders`,
    {
      method: 'POST',
      token,
      body: data,
    },
  );
}

export async function getOrders(
  userId: number,
  token: string,
): Promise<Order[]> {
  return await apiRequest<Order[]>(
    `/v1/users/${userId}/orders`,
    {
      token,
    },
  );
}

export async function getOrder(
  userId: number,
  orderId: number,
  token: string,
): Promise<Order> {
  return await apiRequest<Order>(
    `/v1/users/${userId}/orders/${orderId}`,
    {
      token,
    },
  );
}