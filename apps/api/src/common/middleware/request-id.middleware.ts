import type { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const requestId =
    request.header('x-request-id') ??
    crypto.randomUUID();

  response.setHeader('X-Request-ID', requestId);

  next();
}