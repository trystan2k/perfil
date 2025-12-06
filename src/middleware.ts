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
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];

  // Add script-src with unsafe-inline/eval only in development
  const isDev = import.meta.env.DEV;
  if (isDev) {
    baseDirectives.push("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    baseDirectives.push("style-src 'self' 'unsafe-inline' fonts.googleapis.com");
  } else {
    baseDirectives.push("script-src 'self'");
    baseDirectives.push("style-src 'self' fonts.googleapis.com");
  }

  return baseDirectives.join('; ');
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const startTime = Date.now();

  try {
    // Get response from next middleware or route
    const response = await next();

    // Apply security headers to response
    response.headers.set('Content-Security-Policy', getCspHeader());

    // Apply additional security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Development logging with performance timing
    const isDebug = import.meta.env.DEBUG === 'true' || import.meta.env.DEV;
    if (isDebug) {
      const duration = Date.now() - startTime;
      console.log(`📝 ${request.method} ${url.pathname} - ${duration}ms`);
      console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
    }

    return response;
  } catch (error) {
    console.error('❌ Middleware error:', error);

    // Return secure error response with security headers
    const errorHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      errorHeaders[key] = value;
    }

    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        ...errorHeaders,
      },
    });
  }
});
