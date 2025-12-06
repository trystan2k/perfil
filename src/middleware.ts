import { defineMiddleware } from 'astro:middleware';

// Environment-based configuration
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Security headers configuration
const SECURITY_HEADERS = {
  'Strict-Transport-Security': isProd
    ? 'max-age=31536000; includeSubDomains; preload'
    : 'max-age=3600',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Content Security Policy
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for React development
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "font-src 'self' fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
];

const CSP_HEADER = CSP_DIRECTIVES.join('; ');

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const startTime = Date.now();

  try {
    // Get the response
    const response = await next();

    // Create a new response with modified headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // Add security headers
    newResponse.headers.set('Content-Security-Policy', CSP_HEADER);

    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });

    // Development logging
    if (isDev) {
      const duration = Date.now() - startTime;
      console.log(`📝 ${request.method} ${url.pathname} - ${duration}ms`);

      // Log request details
      console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
      console.log('🔍 Response headers:', Object.fromEntries(newResponse.headers.entries()));
    }

    return newResponse;
  } catch (error) {
    console.error('❌ Middleware error:', error);

    // Return a basic error response
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        ...SECURITY_HEADERS,
      },
    });
  }
});
