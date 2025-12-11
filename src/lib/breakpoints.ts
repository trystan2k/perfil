/**
 * Responsive breakpoints for the application
 *
 * These are derived from Tailwind CSS default breakpoints and should be kept in sync
 * with the tailwind.config.mjs values.
 *
 * Usage in React components:
 * ```tsx
 * const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
 * ```
 *
 * Usage in CSS:
 * ```css
 * @media (min-width: 768px) { ... }
 * ```
 */

/**
 * Breakpoint values in pixels (from Tailwind CSS defaults)
 *
 * Reference:
 * - Tailwind docs: https://tailwindcss.com/docs/responsive-design#breakpoints
 * - Our config: tailwind.config.mjs
 */
export const BREAKPOINTS = {
  /**
   * Extra small devices (mobile phones)
   * Default Tailwind: 0px
   */
  xs: 0,

  /**
   * Small devices (landscape phones)
   * Default Tailwind: 640px
   */
  sm: 640,

  /**
   * Medium devices (tablets)
   * Default Tailwind: 768px
   * Primary mobile/desktop boundary
   */
  md: 768,

  /**
   * Large devices (small laptops)
   * Default Tailwind: 1024px
   */
  lg: 1024,

  /**
   * Extra large devices (large laptops)
   * Default Tailwind: 1280px
   */
  xl: 1280,

  /**
   * 2XL devices (large desktop monitors)
   * Default Tailwind: 1536px
   */
  '2xl': 1536,
} as const;

/**
 * Media query helper functions
 */
export const MEDIA_QUERIES = {
  /**
   * Mobile-first: up to md breakpoint (tablet and below)
   * Usage: useMediaQuery(MEDIA_QUERIES.mobile)
   */
  mobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,

  /**
   * Tablet and up
   * Usage: useMediaQuery(MEDIA_QUERIES.tablet)
   */
  tablet: `(min-width: ${BREAKPOINTS.md}px)`,

  /**
   * Desktop and up
   * Usage: useMediaQuery(MEDIA_QUERIES.desktop)
   */
  desktop: `(min-width: ${BREAKPOINTS.lg}px)`,

  /**
   * Large desktop and up
   * Usage: useMediaQuery(MEDIA_QUERIES.largeDesktop)
   */
  largeDesktop: `(min-width: ${BREAKPOINTS.xl}px)`,
} as const;

/**
 * Tailwind breakpoint names for consistency
 */
export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Get CSS media query string for a breakpoint
 * @param breakpoint - The breakpoint name or pixel value
 * @param minOrMax - Whether to use min-width (up) or max-width (down)
 * @returns Media query string
 *
 * @example
 * // Get media query for "mobile or below"
 * getMediaQuery('md', 'max')  // -> "(max-width: 767px)"
 *
 * @example
 * // Get media query for "tablet and up"
 * getMediaQuery('md', 'min')  // -> "(min-width: 768px)"
 */
export function getMediaQuery(breakpoint: BreakpointName, minOrMax: 'min' | 'max' = 'min'): string {
  const value = BREAKPOINTS[breakpoint];
  const px = minOrMax === 'max' ? value - 1 : value;
  const property = minOrMax === 'max' ? 'max-width' : 'min-width';
  return `(${property}: ${px}px)`;
}

/**
 * Check if a breakpoint is mobile
 * @param breakpoint - The breakpoint name
 * @returns true if breakpoint is considered mobile (< md)
 */
export function isMobileBreakpoint(breakpoint: BreakpointName): boolean {
  return BREAKPOINTS[breakpoint] < BREAKPOINTS.md;
}

/**
 * Check if a breakpoint is desktop
 * @param breakpoint - The breakpoint name
 * @returns true if breakpoint is considered desktop (>= md)
 */
export function isDesktopBreakpoint(breakpoint: BreakpointName): boolean {
  return BREAKPOINTS[breakpoint] >= BREAKPOINTS.md;
}
