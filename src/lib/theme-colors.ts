/**
 * Theme colors for PWA manifest and browser chrome
 * These values match the CSS --background variable colors:
 * - Light: hsl(0 0% 96%) ≈ #f5f5f5
 * - Dark: hsl(0 0% 8%) ≈ #141414
 */
export const THEME_COLORS = {
  light: '#f5f5f5',
  dark: '#141414',
} as const;

export type ThemeColor = (typeof THEME_COLORS)[keyof typeof THEME_COLORS];
