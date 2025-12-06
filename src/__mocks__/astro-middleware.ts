/**
 * Mock for astro:middleware
 * Provides a mock implementation of Astro's middleware API for testing
 */

import type { APIContext, MiddlewareNext } from 'astro';

export function defineMiddleware(
  handler: (context: APIContext, next: MiddlewareNext) => Promise<Response>
): (context: APIContext, next: MiddlewareNext) => Promise<Response> {
  return handler;
}
