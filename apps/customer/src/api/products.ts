import { apiRequest } from './client';

export type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  categoryId: number | null;
  isActive: boolean;
  slug: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
};

export async function getProducts(): Promise<Product[]> {
  return await apiRequest<Product[]>('/v1/products');
}