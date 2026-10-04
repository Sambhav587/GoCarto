import { apiRequest } from './client';

export type AdminUser = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  role: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AdminUser;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return await apiRequest<LoginResponse>(
    '/v1/auth/login',
    {
      method: 'POST',
      body: {
        email,
        password,
      },
    },
  );
}