import { defineMiddleware } from 'astro:middleware';

// Security headers configuration - optimized for production vs development
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Content Security Policy with environment-aware directives
const getCspHeader = (): string => {
  const baseDirectives = [
    "default-src 'self'",
    "font-src 'self' fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];

  return baseDirectives.join('; ');
};

export const onRequest = defineMiddleware(async (_context, next) => {
  try {
    // Get response from next middleware or route
    const response = await next();

    // Apply security headers to response
    response.headers.set('Content-Security-Policy', getCspHeader());

    // Apply additional security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (_error) {
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Security-Policy': getCspHeader(),
        ...SECURITY_HEADERS,
      },
    });
  }
});
