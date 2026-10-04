import {
  clearAccessToken,
} from './auth-storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:3000';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

type AuthFailureListener = () => void;

const authFailureListeners =
  new Set<AuthFailureListener>();

export function onAuthFailure(
  listener: AuthFailureListener,
): () => void {
  authFailureListeners.add(listener);

  return () => {
    authFailureListeners.delete(listener);
  };
}

async function handleAuthFailure(): Promise<void> {
  await clearAccessToken();

  for (const listener of authFailureListeners) {
    listener();
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token
          ? {
              Authorization: `Bearer ${options.token}`,
            }
          : {}),
      },
      ...(options.body !== undefined
        ? {
            body: JSON.stringify(options.body),
          }
        : {}),
    },
  );

  const contentType =
    response.headers.get('content-type') ?? '';

  const data = contentType.includes(
    'application/json',
  )
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401 && options.token) {
      await handleAuthFailure();
    }

    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data
        ? String(
            (data as { message: unknown }).message,
          )
        : `API request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export type AiChatResponse = {
  answer: string;
};

export async function askAi(
  message: string,
  token: string,
): Promise<AiChatResponse> {
  return await apiRequest<AiChatResponse>(
    '/v1/ai/chat',
    {
      method: 'POST',
      token,
      body: {
        message,
      },
    },
  );
}