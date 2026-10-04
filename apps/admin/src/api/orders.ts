import { apiRequest } from './client';

export type AdminOrderItem = {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type AdminOrder = {
  id: number;
  userId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  deliveryAddress: string;
  latitude: number | null;
  longitude: number | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
};

export async function getAdminOrders(
  token: string,
): Promise<AdminOrder[]> {
  return await apiRequest<AdminOrder[]>(
    '/v1/admin/orders',
    {
      token,
    },
  );
}

export async function updateAdminOrderStatus(
  orderId: number,
  status: string,
  token: string,
): Promise<AdminOrder> {
  return await apiRequest<AdminOrder>(
    `/v1/admin/orders/${orderId}/status`,
    {
      method: 'PATCH',
      token,
      body: {
        status,
      },
    },
  );
}