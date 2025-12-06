import type { APIContext, MiddlewareNext } from 'astro';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../middleware';

/**
 * Middleware Test Suite
 *
 * Tests for src/middleware.ts covering:
 * - Security headers are properly applied by real middleware
 * - CSP functionality with real implementation
 * - Development logging with real middleware behavior
 * - Error handling with real middleware
 * - Response handling preserves original data
 */

/**
 * Helper to ensure response is typed as Response (not void | Response)
 */
function assertResponse(response: Promise<Response> | Response | Promise<void> | void): Response {
  if (!response) {
    throw new Error('Response is undefined');
  }
  return response as Response;
}

/**
 * Helper to create a real middleware context that can be passed to onRequest
 */
function createMiddlewareContext(
  method: string = 'GET',
  pathname: string = '/test',
  requestHeaders: Record<string, string> = {}
): { context: APIContext; nextFn: MiddlewareNext } {
  const headers = new Headers({
    'content-type': 'application/json',
    'user-agent': 'test-agent',
    ...requestHeaders,
  });

  const url = new URL(`http://localhost${pathname}`);

  // Create a mock 'next' function that returns a response
  const nextFn: MiddlewareNext = vi.fn(
    async () =>
      new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      })
  );

  return {
    context: {
      request: new Request(url, { method, headers }),
      url,
    } as unknown as APIContext,
    nextFn,
  };
}

/**
 * Helper to create a custom next function that returns a specific response
 */
function createCustomNext(response: Response): MiddlewareNext {
  return vi.fn(async () => response);
}

/**
 * Helper to create a next function that throws an error
 */
function createErrorNext(error: Error): MiddlewareNext {
  return vi.fn(async () => {
    throw error;
  });
}

describe('middleware', () => {
  beforeEach(() => {
    import.meta.env.DEBUG = false;
    import.meta.env.DEV = true;
  });

  describe('Real Middleware - Security Headers', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      import.meta.env.DEBUG = true;
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      import.meta.env.DEBUG = false;
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should apply Strict-Transport-Security header to response', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.headers.has('Strict-Transport-Security')).toBe(true);
      const hstsValue = response.headers.get('Strict-Transport-Security');
      expect(hstsValue).toBeDefined();
      expect(hstsValue).toContain('max-age=');
    });

    it('should apply X-Frame-Options DENY header to all responses', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply X-Content-Type-Options nosniff header', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should apply Referrer-Policy header', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should apply Permissions-Policy header with restricted permissions', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const permPolicy = response.headers.get('Permissions-Policy');
      expect(permPolicy).toBeDefined();
      expect(permPolicy).toContain('camera=()');
      expect(permPolicy).toContain('microphone=()');
      expect(permPolicy).toContain('geolocation=()');
    });

    it('should apply Cross-Origin-Embedder-Policy header', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const coepValue = response.headers.get('Cross-Origin-Embedder-Policy');
      expect(coepValue).toBeDefined();
      expect(['credentialless', 'require-corp']).toContain(coepValue);
    });

    it('should apply Cross-Origin-Opener-Policy same-origin header', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    });

    it('should apply Cross-Origin-Resource-Policy same-origin header', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    });

    it('should include all required security headers in response', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const requiredHeaders = [
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Cross-Origin-Embedder-Policy',
        'Cross-Origin-Opener-Policy',
        'Cross-Origin-Resource-Policy',
        'Content-Security-Policy',
      ];

      requiredHeaders.forEach((header) => {
        expect(response.headers.has(header), `Missing security header: ${header}`).toBe(true);
      });
    });
  });

  describe('Real Middleware - Content Security Policy', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should include Content-Security-Policy header in response', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toBeDefined();
      expect(typeof cspHeader).toBe('string');
    });

    it('should include default-src self directive in CSP', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("default-src 'self'");
    });

    it('should include script-src with self directive', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("script-src 'self'");
    });

    it('should include style-src with self and Google Fonts', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("style-src 'self'");
      expect(cspHeader).toContain('fonts.googleapis.com');
    });

    it('should include font-src with Google Fonts', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("font-src 'self'");
      expect(cspHeader).toContain('fonts.gstatic.com');
    });

    it('should include img-src with self, data, and https', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("img-src 'self'");
      expect(cspHeader).toContain('data:');
      expect(cspHeader).toContain('https:');
    });

    it('should include connect-src with self only', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("connect-src 'self'");
    });

    it('should disable frame embedding with frame-src none', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("frame-src 'none'");
    });

    it('should disable object embedding with object-src none', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("object-src 'none'");
    });

    it('should restrict base URI to self', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("base-uri 'self'");
    });

    it('should restrict form actions to self', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("form-action 'self'");
    });

    it('should disable frame ancestors', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain("frame-ancestors 'none'");
    });

    it('should include upgrade-insecure-requests directive', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toContain('upgrade-insecure-requests');
    });

    it('should have all critical CSP directives in real response', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');

      const criticalDirectives = [
        "default-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ];

      criticalDirectives.forEach((directive) => {
        expect(cspHeader).toContain(directive);
      });
    });
  });

  describe('Real Middleware - Request Logging', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    describe('Development Logging (DEBUG mode enabled)', () => {
      it('should call next function to get response', async () => {
        const { context, nextFn } = createMiddlewareContext('GET', '/test');
        await onRequest(context, nextFn);

        expect(nextFn).toHaveBeenCalled();
      });

      it('should pass response through middleware with security headers applied', async () => {
        const { context, nextFn } = createMiddlewareContext('GET', '/test-path');
        const response = assertResponse(await onRequest(context, nextFn));

        // Response should have security headers added by middleware
        expect(response.headers.has('Content-Security-Policy')).toBe(true);
        expect(response.headers.has('X-Frame-Options')).toBe(true);
      });

      it('should preserve original response status from next()', async () => {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(
          new Response(JSON.stringify({ data: 'test' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );

        const response = assertResponse(await onRequest(context, customNext));
        expect(response.status).toBe(200);
      });

      it('should preserve original response body', async () => {
        const testData = { data: 'test', value: 123 };
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(
          new Response(JSON.stringify(testData), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        );

        const response = assertResponse(await onRequest(context, customNext));
        const responseData = await response.json();
        expect(responseData).toEqual(testData);
      });

      it('should preserve original response content-type header', async () => {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(
          new Response('', {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          })
        );

        const response = assertResponse(await onRequest(context, customNext));
        expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
      });

      it('should handle different HTTP methods', async () => {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

        for (const method of methods) {
          const { context, nextFn } = createMiddlewareContext(method, '/api/endpoint');
          const response = assertResponse(await onRequest(context, nextFn));

          expect(response.status).toBe(200);
          expect(response.headers.has('X-Frame-Options')).toBe(true);
        }
      });

      it('should handle different URL paths', async () => {
        const paths = ['/', '/api/test', '/pages/profile', '/static/style.css'];

        for (const path of paths) {
          const { context, nextFn } = createMiddlewareContext('GET', path);
          const response = assertResponse(await onRequest(context, nextFn));

          expect(response.headers.has('Content-Security-Policy')).toBe(true);
        }
      });
    });

    describe('Production Logging (DEBUG mode disabled)', () => {
      it('should still apply security headers in production', async () => {
        const { nextFn, context } = createMiddlewareContext('GET', '/');
        const response = assertResponse(await onRequest(context, nextFn));

        // Security headers should always be applied regardless of logging
        expect(response.headers.has('Strict-Transport-Security')).toBe(true);
        expect(response.headers.has('X-Frame-Options')).toBe(true);
      });

      it('should apply strict HSTS in production when applicable', async () => {
        const { nextFn, context } = createMiddlewareContext('GET', '/');
        const response = assertResponse(await onRequest(context, nextFn));

        const hsts = response.headers.get('Strict-Transport-Security');
        expect(hsts).toBeDefined();
        // Should contain either dev or prod configuration
        expect(hsts).toContain('max-age=');
      });
    });
  });

  describe('Real Middleware - Error Handling', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should catch errors thrown by next() and return 500 response', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Next function failed'));

      const response = assertResponse(await onRequest(context, errorNext));

      expect(response.status).toBe(500);
      expect(response.headers.get('Content-Type')).toBe('text/plain');
    });

    it('should log error to console when error occurs', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Test error'));

      await onRequest(context, errorNext);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorCall = consoleErrorSpy.mock.calls[0];
      expect(String(errorCall[0])).toContain('Middleware error');
    });

    it('should include security headers in error response', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Error to test security headers'));

      const response = assertResponse(await onRequest(context, errorNext));

      expect(response.headers.has('X-Frame-Options')).toBe(true);
      expect(response.headers.has('X-Content-Type-Options')).toBe(true);
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should return "Internal Server Error" text in error response body', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Something went wrong'));

      const response = assertResponse(await onRequest(context, errorNext));
      const responseText = await response.text();

      expect(responseText).toBe('Internal Server Error');
    });

    it('should include Strict-Transport-Security header in error response', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Error test'));

      const response = assertResponse(await onRequest(context, errorNext));

      expect(response.headers.has('Strict-Transport-Security')).toBe(true);
    });

    it('should include Referrer-Policy header in error response', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Error test'));

      const response = assertResponse(await onRequest(context, errorNext));

      expect(response.headers.has('Referrer-Policy')).toBe(true);
    });

    it('should include Permissions-Policy header in error response', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Error test'));

      const response = assertResponse(await onRequest(context, errorNext));

      expect(response.headers.has('Permissions-Policy')).toBe(true);
    });

    it('should recover and return valid response on error', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Recovery test'));

      const response = assertResponse(await onRequest(context, errorNext));

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);
    });

    it('should include all critical security headers in error response', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Critical test'));

      const response = assertResponse(await onRequest(context, errorNext));

      const criticalHeaders = [
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
      ];

      criticalHeaders.forEach((header) => {
        expect(
          response.headers.has(header),
          `Missing security header in error response: ${header}`
        ).toBe(true);
      });
    });
  });

  describe('Real Middleware - Response Handling', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should pass through normal 2xx responses unchanged', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(
        new Response(JSON.stringify({ data: 'test' }), { status: 200 })
      );

      const response = assertResponse(await onRequest(context, customNext));

      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    });

    it('should preserve original response body content', async () => {
      const testData = { message: 'success', id: 123 };
      const { context } = createMiddlewareContext('GET', '/api/data');
      const customNext = createCustomNext(
        new Response(JSON.stringify(testData), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

      const response = assertResponse(await onRequest(context, customNext));
      const responseData = await response.json();

      expect(responseData).toEqual(testData);
    });

    it('should preserve original content-type header', async () => {
      const { context } = createMiddlewareContext('POST', '/api/submit');
      const customNext = createCustomNext(
        new Response('{}', {
          status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        })
      );

      const response = assertResponse(await onRequest(context, customNext));

      expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    });

    it('should preserve response status codes for various HTTP statuses', async () => {
      const testCases = [
        { status: 200, description: 'OK' },
        { status: 201, description: 'Created' },
        { status: 301, description: 'Moved Permanently' },
        { status: 400, description: 'Bad Request' },
        { status: 401, description: 'Unauthorized' },
        { status: 403, description: 'Forbidden' },
        { status: 404, description: 'Not Found' },
      ];

      for (const { status, description } of testCases) {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(new Response('OK', { status }));

        const response = assertResponse(await onRequest(context, customNext));
        expect(response.status === status, `Failed for status ${status} - ${description}`).toBe(
          true
        );
      }
    });

    it('should add security headers without removing original headers', async () => {
      const originalHeaders = {
        'x-custom-header': 'custom-value',
        'cache-control': 'no-cache',
      };

      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(
        new Response('', {
          status: 200,
          headers: originalHeaders,
        })
      );

      const response = assertResponse(await onRequest(context, customNext));

      // Original headers should be preserved
      expect(response.headers.get('x-custom-header')).toBe('custom-value');
      expect(response.headers.get('cache-control')).toBe('no-cache');

      // Security headers should be added
      expect(response.headers.has('X-Frame-Options')).toBe(true);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle empty response body', async () => {
      const { context } = createMiddlewareContext('DELETE', '/resource/123');
      const customNext = createCustomNext(new Response('OK', { status: 200 }));

      const response = assertResponse(await onRequest(context, customNext));
      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should apply middleware to all successful response status codes', async () => {
      const statusCodes = [200, 201, 202, 203, 206];

      for (const status of statusCodes) {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(new Response('', { status }));

        const response = assertResponse(await onRequest(context, customNext));

        expect(response.headers.has('Content-Security-Policy')).toBe(true);
        expect(response.headers.has('X-Frame-Options')).toBe(true);
      }
    });

    it('should apply middleware to all client error response codes', async () => {
      const statusCodes = [400, 401, 403, 404, 405];

      for (const status of statusCodes) {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(new Response('', { status }));

        const response = assertResponse(await onRequest(context, customNext));

        expect(response.headers.has('Content-Security-Policy')).toBe(true);
        expect(response.headers.has('X-Frame-Options')).toBe(true);
      }
    });

    it('should apply middleware to all server error response codes', async () => {
      const statusCodes = [500, 501, 502, 503];

      for (const status of statusCodes) {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(new Response('', { status }));

        const response = assertResponse(await onRequest(context, customNext));

        expect(response.headers.has('Content-Security-Policy')).toBe(true);
        expect(response.headers.has('X-Frame-Options')).toBe(true);
      }
    });

    it('should handle responses with large content', async () => {
      const largeContent = 'x'.repeat(50000);
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(new Response(largeContent, { status: 200 }));

      const response = assertResponse(await onRequest(context, customNext));
      const text = await response.text();

      expect(text.length).toBe(50000);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle responses with special characters', async () => {
      const specialContent = '{"text": "Special chars: 🔒 ✓ © ®"}';
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(
        new Response(specialContent, {
          status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        })
      );

      const response = assertResponse(await onRequest(context, customNext));
      const text = await response.text();

      expect(text).toContain('🔒');
      expect(text).toContain('©');
    });
  });

  describe('Real Middleware - Integration Tests', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle complete successful request-response cycle', async () => {
      const { context, nextFn } = createMiddlewareContext('GET', '/api/data');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(context.request.method).toBe('GET');
      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should apply middleware to all request methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of methods) {
        const { context } = createMiddlewareContext(method, '/api/endpoint');
        const customNext = createCustomNext(new Response('OK', { status: 200 }));
        const response = assertResponse(await onRequest(context, customNext));

        expect(response.status).toBe(200);
        expect(response.headers.has('X-Frame-Options')).toBe(true);
        expect(response.headers.has('Content-Security-Policy')).toBe(true);
      }
    });

    it('should apply middleware to various URL paths', async () => {
      const paths = ['/', '/api/test', '/pages/profile', '/static/style.css', '/api/v1/users'];

      for (const path of paths) {
        const { context, nextFn } = createMiddlewareContext('GET', path);
        const response = assertResponse(await onRequest(context, nextFn));

        expect(response.headers.has('Content-Security-Policy')).toBe(true);
        expect(response.headers.has('X-Frame-Options')).toBe(true);
      }
    });

    it('should handle various response status codes', async () => {
      const statusCodes = [200, 201, 301, 400, 401, 403, 404, 500, 502];

      for (const status of statusCodes) {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(new Response('OK', { status }));

        const response = assertResponse(await onRequest(context, customNext));

        expect(response.status).toBe(status);
        // Security headers should be applied to all statuses
        expect(response.headers.has('X-Frame-Options')).toBe(true);
      }
    });

    it('should maintain request-response integrity with different content types', async () => {
      const testCases = [
        { contentType: 'application/json', body: '{"status":"ok"}' },
        { contentType: 'text/html', body: '<html></html>' },
        { contentType: 'text/plain', body: 'plain text response' },
      ];

      for (const { contentType, body } of testCases) {
        const { context } = createMiddlewareContext('GET', '/');
        const customNext = createCustomNext(
          new Response(body, {
            status: 200,
            headers: { 'content-type': contentType },
          })
        );

        const response = assertResponse(await onRequest(context, customNext));

        expect(response.headers.get('content-type')).toBe(contentType);
        expect(await response.text()).toBe(body);
      }
    });

    it('should handle request headers with various custom values', async () => {
      const customHeaders = {
        'x-request-id': 'req-123-456',
        'x-user-agent': 'custom-agent/1.0',
        authorization: 'Bearer token123',
      };

      const { context, nextFn } = createMiddlewareContext('POST', '/api/submit', customHeaders);
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle middleware with empty request and response bodies', async () => {
      const { context } = createMiddlewareContext('DELETE', '/resource/123');
      const customNext = createCustomNext(new Response('OK', { status: 200 }));

      const response = assertResponse(await onRequest(context, customNext));

      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should consistently apply security headers across multiple requests', async () => {
      const contexts = [
        createMiddlewareContext('GET', '/page1'),
        createMiddlewareContext('GET', '/page2'),
        createMiddlewareContext('GET', '/page3'),
      ];

      for (const { context, nextFn } of contexts) {
        const response = assertResponse(await onRequest(context, nextFn));

        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(response.headers.has('Strict-Transport-Security')).toBe(true);
      }
    });

    it('should handle rapid sequential middleware invocations', async () => {
      const responses = [];

      for (let i = 0; i < 5; i++) {
        const { context, nextFn } = createMiddlewareContext('GET', `/path${i}`);
        const response = assertResponse(await onRequest(context, nextFn));
        responses.push(response);
      }

      // All responses should have middleware applied
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.headers.has('Content-Security-Policy')).toBe(true);
      });
    });

    it('should apply middleware correctly when next() returns different status codes', async () => {
      const { context: successContext } = createMiddlewareContext('GET', '/');
      const successNext = createCustomNext(new Response('OK', { status: 200 }));
      const successResponse = assertResponse(await onRequest(successContext, successNext));

      const { context: errorContext } = createMiddlewareContext('GET', '/');
      const errorNext = createCustomNext(new Response('Not Found', { status: 404 }));
      const errorResponse = assertResponse(await onRequest(errorContext, errorNext));

      // Both should have security headers
      expect(successResponse.headers.has('X-Frame-Options')).toBe(true);
      expect(errorResponse.headers.has('X-Frame-Options')).toBe(true);

      // But preserve their original status codes
      expect(successResponse.status).toBe(200);
      expect(errorResponse.status).toBe(404);
    });
  });

  describe('Real Middleware - Development/Production Behavior', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should always apply security headers regardless of environment', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.headers.has('Strict-Transport-Security')).toBe(true);
      expect(response.headers.has('X-Frame-Options')).toBe(true);
      expect(response.headers.has('X-Content-Type-Options')).toBe(true);
    });

    it('should apply CSP with environment-specific directives', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');

      // Base directives should always be present
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain('upgrade-insecure-requests');
    });

    it('should include Strict-Transport-Security with max-age value', async () => {
      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const hsts = response.headers.get('Strict-Transport-Security');
      expect(hsts).toBeDefined();
      expect(hsts).toMatch(/max-age=\d+/);
    });

    it('should handle both development and production CSP setups', async () => {
      import.meta.env.DEV = true;

      const { nextFn, context } = createMiddlewareContext('GET', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      const cspHeader = response.headers.get('Content-Security-Policy');

      // Should include script-src with self
      expect(cspHeader).toContain("script-src 'self'");
      expect(cspHeader).toContain("'unsafe-inline'");

      import.meta.env.DEV = false;
      const responseProd = assertResponse(await onRequest(context, nextFn));

      const cspHeaderProd = responseProd.headers.get('Content-Security-Policy');

      // Should include script-src with self
      expect(cspHeaderProd).toContain("script-src 'self'");
      expect(cspHeaderProd).not.toContain("'unsafe-inline'");
    });

    it('should always catch and handle errors in any environment', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const errorNext = createErrorNext(new Error('Test error'));

      const response = assertResponse(await onRequest(context, errorNext));

      expect(response.status).toBe(500);
      expect(response.headers.has('X-Frame-Options')).toBe(true);
    });

    it('should apply middleware consistently across different paths', async () => {
      const paths = ['/api/users', '/static/css/style.css', '/page', '/admin/dashboard'];

      for (const path of paths) {
        const { context, nextFn } = createMiddlewareContext('GET', path);
        const response = assertResponse(await onRequest(context, nextFn));

        expect(response.headers.has('Content-Security-Policy')).toBe(true);
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      }
    });
  });

  describe('Real Middleware - Edge Cases', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle requests with minimal headers', async () => {
      const { context, nextFn } = createMiddlewareContext('GET', '/', {});
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle responses with no body content', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(new Response(null, { status: 200 }));

      const response = assertResponse(await onRequest(context, customNext));
      const text = await response.text();

      expect(text).toBe('');
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle very long request paths', async () => {
      const longPath = `/api/${'segment/'.repeat(50)}`;
      const { context, nextFn } = createMiddlewareContext('GET', longPath);
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.status).toBe(200);
      expect(response.headers.has('X-Frame-Options')).toBe(true);
    });

    it('should handle URLs with query parameters', async () => {
      const { context, nextFn } = createMiddlewareContext(
        'GET',
        '/api/search?q=test&filter=active&limit=10'
      );
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle responses with large content bodies', async () => {
      const largeContent = 'x'.repeat(100000);
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(new Response(largeContent, { status: 200 }));

      const response = assertResponse(await onRequest(context, customNext));
      const text = await response.text();

      expect(text.length).toBe(100000);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle headers with special characters and semicolons', async () => {
      const { context, nextFn } = createMiddlewareContext('GET', '/', {
        'x-special': 'value; with; semicolons',
        'x-quoted': '"quoted value"',
      });

      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle rapid consecutive middleware invocations', async () => {
      const responses = [];

      for (let i = 0; i < 10; i++) {
        const { context, nextFn } = createMiddlewareContext('GET', `/path${i}`);
        const response = assertResponse(await onRequest(context, nextFn));
        responses.push(response);
      }

      // All should have security headers applied
      responses.forEach((response) => {
        expect(response.headers.has('Content-Security-Policy')).toBe(true);
      });
    });

    it('should handle responses with custom cookies', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(
        new Response('OK', {
          status: 200,
          headers: {
            'set-cookie': 'session=abc123; Path=/; HttpOnly; SameSite=Strict',
          },
        })
      );

      const response = assertResponse(await onRequest(context, customNext));

      expect(response.headers.has('set-cookie')).toBe(true);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle responses with content encoding headers', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(
        new Response(Buffer.alloc(0), {
          status: 200,
          headers: {
            'content-encoding': 'gzip',
            'content-type': 'application/json',
          },
        })
      );

      const response = assertResponse(await onRequest(context, customNext));

      expect(response.headers.get('content-encoding')).toBe('gzip');
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle responses with cache control headers', async () => {
      const { context } = createMiddlewareContext('GET', '/');
      const customNext = createCustomNext(
        new Response('data', {
          status: 200,
          headers: {
            'cache-control': 'max-age=3600, public',
            etag: '"abc123"',
          },
        })
      );

      const response = assertResponse(await onRequest(context, customNext));

      expect(response.headers.get('cache-control')).toBe('max-age=3600, public');
      expect(response.headers.get('etag')).toBe('"abc123"');
    });

    it('should handle HEAD requests correctly', async () => {
      const { context, nextFn } = createMiddlewareContext('HEAD', '/');
      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.status).toBe(200);
      expect(response.headers.has('Content-Security-Policy')).toBe(true);
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const { context, nextFn } = createMiddlewareContext('OPTIONS', '/api/endpoint', {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'POST',
      });

      const response = assertResponse(await onRequest(context, nextFn));

      expect(response.status).toBe(200);
      expect(response.headers.has('X-Frame-Options')).toBe(true);
    });

    it('should handle responses with location redirects', async () => {
      const { context } = createMiddlewareContext('GET', '/old-path');
      const customNext = createCustomNext(
        new Response(null, {
          status: 301,
          headers: {
            location: '/new-path',
          },
        })
      );

      const response = assertResponse(await onRequest(context, customNext));

      expect(response.status).toBe(301);
      expect(response.headers.get('location')).toBe('/new-path');
      expect(response.headers.has('X-Frame-Options')).toBe(true);
    });
  });
});
