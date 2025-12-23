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

// Cache control headers for different content types
const getCacheControlHeader = (url: URL): string => {
  const pathname = url.pathname;

  // Favicon and apple-touch-icon: very long cache (1 year) - browser special handling
  // These are requested frequently but rarely change, so aggressive caching is safe
  if (pathname === '/favicon.png' || pathname.match(/^\/icons\/icon-.*\.png$/i)) {
    return 'public, max-age=31536000, immutable'; // 1 year
  }

  // Manifest: frequent updates (6 hours) - CHECK THIS FIRST
  if (pathname === '/data/manifest.json') {
    return 'public, max-age=21600, stale-while-revalidate=3600'; // 6 hours + 1 hour revalidate
  }

  // Data files: medium cache (7 days)
  if (pathname.match(/\/data\/.*\/.*\.json$/i)) {
    return 'public, max-age=604800, stale-while-revalidate=86400'; // 7 days + 1 day revalidate
  }

  // Static assets: long cache (30 days)
  if (pathname.match(/\.(js|css|woff2?|png|svg|webp|ico)$/i)) {
    return 'public, max-age=2592000, immutable'; // 30 days
  }

  // Translation files: long cache (30 days)
  if (pathname.match(/\/locales\/.*\.json$/i)) {
    return 'public, max-age=2592000, immutable'; // 30 days
  }

  // HTML/Dynamic content: no cache
  return 'public, max-age=0, must-revalidate';
};

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    // Intercept root path redirect to use stored locale preference
    const { url, cookies, redirect } = context;

    // Check if this is a root path request that Astro will redirect
    // Only perform redirect if we have the necessary functions (not in test environment)
    if (url.pathname === '/' && cookies && redirect) {
      // Read stored locale from cookie (set by client-side localeStorage)
      const storedLocale = cookies.get('perfil-locale')?.value;
      const supportedLocales = ['en', 'es', 'pt-BR'];

      // Validate and use stored locale, fallback to 'en'
      const targetLocale =
        storedLocale && supportedLocales.includes(storedLocale) ? storedLocale : 'en';

      // Redirect to the appropriate locale path
      return redirect(`/${targetLocale}/`, 302);
    }

    // Get response from next middleware or route
    const response = await next();

    // Apply cache headers for data files (manifest, profile data, translations)
    const pathname = context.url.pathname;
    if (pathname.match(/^\/data\//i) || pathname.match(/^\/locales\//i)) {
      // Always set cache headers for data files
      response.headers.set('Cache-Control', getCacheControlHeader(context.url));
    } else if (!response.headers.has('Cache-Control')) {
      // For other content, only set if not already present
      response.headers.set('Cache-Control', getCacheControlHeader(context.url));
    }

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
