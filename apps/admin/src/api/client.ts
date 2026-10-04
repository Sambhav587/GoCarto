const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  'http://localhost:3000';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

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