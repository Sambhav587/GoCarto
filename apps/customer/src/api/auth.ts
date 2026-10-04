import { apiRequest } from './client';

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  username: string | null;
  role: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
  username?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

type ApiAuthUser = {
  id?: number;
  sub?: number;
  email: string;
  name?: string | null;
  username?: string | null;
  role: string;
};

function normalizeAuthUser(
  data: ApiAuthUser,
): AuthUser {
  const id = data.id ?? data.sub;

  if (id === undefined) {
    throw new Error(
      'Authenticated user ID is missing',
    );
  }

  return {
    id,
    email: data.email,
    name: data.name ?? null,
    username: data.username ?? null,
    role: data.role,
  };
}

export async function register(
  data: RegisterInput,
): Promise<AuthUser> {
  const response =
    await apiRequest<ApiAuthUser>(
      '/v1/auth/register',
      {
        method: 'POST',
        body: data,
      },
    );

  return normalizeAuthUser(response);
}

export async function login(
  data: LoginInput,
): Promise<LoginResponse> {
  const response =
    await apiRequest<LoginResponse>(
      '/v1/auth/login',
      {
        method: 'POST',
        body: data,
      },
    );

  return {
    accessToken: response.accessToken,
    user: normalizeAuthUser(response.user),
  };
}

export async function getMe(
  token: string,
): Promise<AuthUser> {
  const response =
    await apiRequest<ApiAuthUser>(
      '/v1/auth/me',
      {
        token,
      },
    );

  return normalizeAuthUser(response);
}